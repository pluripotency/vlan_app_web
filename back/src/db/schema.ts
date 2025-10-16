import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  adminRightBy: integer('admin_right_by').references(() => users.id, { onDelete: 'set null' })
});

export const vlans = pgTable('vlans', {
  vlanId: integer('vlan_id').primaryKey(),
  description: text('description').notNull()
});

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vlanId: integer('vlan_id').references(() => vlans.vlanId, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('pending'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' })
});

export const userRelations = relations(users, ({ many }) => ({
  requests: many(requests)
}));

export const vlanRelations = relations(vlans, ({ many }) => ({
  requests: many(requests)
}));

export const requestRelations = relations(requests, ({ one }) => ({
  user: one(users, {
    fields: [requests.userId],
    references: [users.id]
  }),
  vlan: one(vlans, {
    fields: [requests.vlanId],
    references: [vlans.vlanId]
  })
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Vlan = typeof vlans.$inferSelect;
export type Request = typeof requests.$inferSelect;
