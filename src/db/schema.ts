import { mysqlTable, serial, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = mysqlTable('bookings', {
  id: serial('id').primaryKey(),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: text('address').notNull(),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  notes: text('notes'),
  source: varchar('source', { length: 50 }).default('online').notNull(),
  bookingDate: varchar('booking_date', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
