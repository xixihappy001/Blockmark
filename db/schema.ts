import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const syncedStates = sqliteTable('synced_states', {
  key: text('key').primaryKey(),
  payload: text('payload').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});
