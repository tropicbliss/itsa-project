import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  driver: "aws-data-api",
  dialect: "postgresql",
  dbCredentials: {
    database: Resource.ClientDatabase.database,
    secretArn: Resource.ClientDatabase.secretArn,
    resourceArn: Resource.ClientDatabase.clusterArn,
  },
  schema: ["./packages/**/*.sql.ts"],
  out: "./migrations",
});
