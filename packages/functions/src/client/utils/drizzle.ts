import { Resource } from "sst";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "./schema.sql";

const client = new RDSDataClient({});

export const db = drizzle(client, {
  schema,
  database: Resource.ClientDatabase.database,
  secretArn: Resource.ClientDatabase.secretArn,
  resourceArn: Resource.ClientDatabase.clusterArn,
});
