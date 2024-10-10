import {
  text,
  pgTable,
  uuid,
  date,
  varchar,
  numeric,
  char,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

export const client = pgTable("client", {
  clientId: uuid("client_id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  emailAddress: text("email_address").notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(),
  address: varchar("address", { length: 100 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  countryCode: char("country", { length: 2 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  agentId: uuid("agent_id").notNull(),
});

export const account = pgTable("account", {
  accountId: uuid("account_id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => client.clientId, { onDelete: "cascade" })
    .notNull(),
  accountType: text("account_type").notNull(),
  accountStatus: text("account_status").notNull(),
  openingDate: date("opening_date").notNull(),
  initialDeposit: numeric("initial_deposit", {
    precision: 19,
    scale: 4,
  }).notNull(),
  currency: char("currency", { length: 3 }).notNull(),
  branchId: text("branch_id").notNull(),
});

export const archive = pgTable("archive", {
  id: serial("id").primaryKey(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  table: text("table_name").notNull(),
  data: jsonb("data").notNull(),
});
