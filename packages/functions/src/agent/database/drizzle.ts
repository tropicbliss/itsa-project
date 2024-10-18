import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.sql";
import { Pool } from "pg";

const pool = new Pool({
  host: Resource.ClientDatabase.host,
  port: Resource.ClientDatabase.port,
  user: Resource.ClientDatabase.username,
  password: Resource.ClientDatabase.password,
  database: Resource.ClientDatabase.database,
});

export const db = drizzle(pool, {
  schema,
});
