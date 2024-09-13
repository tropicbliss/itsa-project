import {
  text,
  pgTable,
  uuid,
  date,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";

export const client = pgTable("client", {
  clientId: uuid("client_id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  emailAddress: text("email_address").notNull(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  address: varchar("address", { length: 100 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  country: varchar("country", { length: 50 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
});

export const account = pgTable("account", {
  accountId: uuid("account_id").primaryKey(),
  clientId: uuid("client_id")
    .references(() => client.clientId, { onDelete: "cascade" })
    .notNull(),
  accountType: text("account_type").notNull(),
  accountStatus: text("account_status").notNull(),
  openingDate: date("opening_date").notNull(),
  initialDeposit: numeric("initial_deposit", { precision: 15, scale: 2 }),
  currency: text("currency").notNull(),
  branchId: text("branch_id").notNull(),
});
