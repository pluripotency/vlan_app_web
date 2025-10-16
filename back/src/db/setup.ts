import { sql } from 'drizzle-orm';
import { db } from './index';
import { requests, users, vlans } from './schema';

const defaultVlans = [
  { vlanId: 10, description: 'Corporate LAN' },
  { vlanId: 20, description: 'Guest Network' },
  { vlanId: 30, description: 'Secure Lab' }
];

export async function ensureDatabase() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      admin_right_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vlans (
      vlan_id INTEGER PRIMARY KEY,
      description TEXT NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vlan_id INTEGER NOT NULL REFERENCES vlans(vlan_id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  for (const vlan of defaultVlans) {
    await db.insert(vlans)
      .values(vlan)
      .onConflictDoNothing();
  }

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length === 0) {
    const [alice] = await db
      .insert(users)
      .values({ subject: 'user:alice', name: 'Alice Admin', isAdmin: true })
      .returning();

    const insertedUsers = await db
      .insert(users)
      .values([
        { subject: 'user:bob', name: 'Bob Operator', isAdmin: false, adminRightBy: alice.id },
        { subject: 'user:carol', name: 'Carol Viewer', isAdmin: false, adminRightBy: alice.id }
      ])
      .returning();

    const bob = insertedUsers.find(user => user.subject === 'user:bob');
    const carol = insertedUsers.find(user => user.subject === 'user:carol');

    if (bob && carol) {
      await db.insert(requests).values([
        {
          userId: bob.id,
          vlanId: 10,
          status: 'approved',
          createdBy: alice.id,
          updatedBy: alice.id
        },
        {
          userId: carol.id,
          vlanId: 30,
          status: 'pending',
          createdBy: alice.id,
          updatedBy: alice.id
        }
      ]);
    }
  }
}
