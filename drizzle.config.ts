import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    host: Resource.ClientDatabase.host,
    port: Resource.ClientDatabase.port,
    user: Resource.ClientDatabase.username,
    password: Resource.ClientDatabase.password,
    database: Resource.ClientDatabase.database,
  },
  schema: ["./packages/**/*.sql.ts"],
  out: "./migrations",
});
