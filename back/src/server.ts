import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { ensureDatabase } from './db/setup';
import { db, pool } from './db';
import { requests, users, vlans } from './db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

const RequestStatusEnum = z.enum(['pending', 'approved', 'rejected']);
const createVlanSchema = z.object({
  vlanId: z.number().int().positive(),
  description: z.string().min(1)
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/vlans', async (req, res, next) => {
  try {
    const payload = createVlanSchema.parse(req.body);

    const [existingVlan] = await db.select().from(vlans).where(eq(vlans.vlanId, payload.vlanId));
    if (existingVlan) {
      return res.status(409).json({ error: 'A VLAN with the same ID already exists.' });
    }

    const [createdVlan] = await db
      .insert(vlans)
      .values({ vlanId: payload.vlanId, description: payload.description })
      .returning();

    res.status(201).json(createdVlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

app.get('/api/vlans', async (_req, res, next) => {
  try {
    const vlanList = await db.select().from(vlans).orderBy(vlans.vlanId);
    res.json(vlanList);
  } catch (error) {
    next(error);
  }
});

const createUserSchema = z.object({
  subject: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().optional().default(true),
  isAdmin: z.boolean().optional().default(false),
  adminRightBy: z.number().int().optional().nullable()
});

app.post('/api/users', async (req, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);

    if (payload.adminRightBy) {
      const [admin] = await db.select().from(users).where(eq(users.id, payload.adminRightBy));
      if (!admin || !admin.isAdmin) {
        return res.status(400).json({ error: 'adminRightBy must reference an existing admin user.' });
      }
    }

    const [createdUser] = await db.insert(users)
      .values({
        subject: payload.subject,
        name: payload.name,
        isActive: payload.isActive,
        isAdmin: payload.isAdmin,
        adminRightBy: payload.adminRightBy ?? null
      })
      .returning();

    res.status(201).json(createdUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

app.get('/api/users', async (_req, res, next) => {
  try {
    const userList = await db.select().from(users).orderBy(users.id);
    res.json(userList);
  } catch (error) {
    next(error);
  }
});

const updateAdminSchema = z.object({
  isAdmin: z.boolean(),
  adminId: z.number().int().optional()
});

app.patch('/api/users/:id/admin', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const payload = updateAdminSchema.parse(req.body);

    if (payload.adminId) {
      const [actingAdmin] = await db.select().from(users).where(eq(users.id, payload.adminId));
      if (!actingAdmin || !actingAdmin.isAdmin) {
        return res.status(400).json({ error: 'adminId must belong to an admin user.' });
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isAdmin: payload.isAdmin,
        adminRightBy: payload.isAdmin ? payload.adminId ?? null : null
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

const createRequestSchema = z.object({
  userId: z.number().int(),
  vlanId: z.number().int(),
  createdBy: z.number().int().optional()
});

app.post('/api/requests', async (req, res, next) => {
  try {
    const payload = createRequestSchema.parse(req.body);

    const [requester] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!requester.isActive) {
      return res.status(400).json({ error: 'Inactive users cannot create requests.' });
    }

    const [vlan] = await db.select().from(vlans).where(eq(vlans.vlanId, payload.vlanId));
    if (!vlan) {
      return res.status(404).json({ error: 'VLAN not found' });
    }

    let createdBy: number | null = requester.id;
    if (payload.createdBy) {
      const [creator] = await db.select().from(users).where(eq(users.id, payload.createdBy));
      if (!creator) {
        return res.status(400).json({ error: 'createdBy must reference an existing user.' });
      }
      createdBy = creator.id;
    }

    const [newRequest] = await db
      .insert(requests)
      .values({
        userId: requester.id,
        vlanId: vlan.vlanId,
        status: 'pending',
        createdBy,
        updatedBy: createdBy,
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(newRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

const updateRequestSchema = z.object({
  status: RequestStatusEnum,
  updatedBy: z.number().int()
});

const deleteRequestSchema = z.object({
  userId: z.number().int()
});

app.patch('/api/requests/:id', async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }

    const payload = updateRequestSchema.parse(req.body);

    if (payload.status === 'pending') {
      return res.status(400).json({ error: 'Status updates must be approve or reject actions.' });
    }

    const [actingUser] = await db.select().from(users).where(eq(users.id, payload.updatedBy));
    if (!actingUser) {
      return res.status(404).json({ error: 'updatedBy user not found' });
    }
    if (!actingUser.isAdmin) {
      return res.status(403).json({ error: 'Only admin users can update request status.' });
    }

    const [updatedRequest] = await db
      .update(requests)
      .set({
        status: payload.status,
        updatedBy: actingUser.id,
        updatedAt: new Date()
      })
      .where(eq(requests.id, requestId))
      .returning();

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

app.delete('/api/requests/:id', async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }

    const payload = deleteRequestSchema.parse(req.body);

    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.userId !== payload.userId) {
      return res.status(403).json({ error: 'Users can only cancel their own requests.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled.' });
    }

    await db.delete(requests).where(eq(requests.id, requestId));

    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.flatten() });
      return;
    }
    next(error);
  }
});

app.get('/api/requests', async (_req, res, next) => {
  try {
    const rows = await db.query.requests.findMany({
      with: {
        user: true,
        vlan: true,
        updatedByUser: true,
        createdByUser: true
      },
      orderBy: (request, { desc: descFn }) => [descFn(request.createdAt)]
    });

    const payload = rows.map(row => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vlanId: row.vlanId,
      userId: row.userId,
      updatedBy: row.updatedBy,
      createdBy: row.createdBy,
      requesterName: row.user?.name ?? 'Unknown User',
      requesterSubject: row.user?.subject ?? 'unknown',
      vlanDescription: row.vlan?.description ?? 'Unknown VLAN',
      updatedByName: row.updatedByUser?.name ?? null,
      createdByName: row.createdByUser?.name ?? null
    }));

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

async function start() {
  await ensureDatabase();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch(error => {
  console.error('Failed to start server', error);
  pool.end().catch(() => undefined);
  process.exit(1);
});

process.on('SIGINT', () => {
  pool.end().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  pool.end().finally(() => process.exit(0));
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) {
      next();
    }
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
