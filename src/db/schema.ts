import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const records = pgTable('records', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: text('category').notNull().default('General'),
  status: text('status').notNull().default('active'),
  priority: text('priority').notNull().default('medium'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type RecordSelect = typeof records.$inferSelect;
export type RecordInsert = typeof records.$inferInsert;
