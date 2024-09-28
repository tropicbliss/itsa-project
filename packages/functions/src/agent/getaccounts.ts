import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { db } from "./utils/drizzle";
import { account, client } from "./utils/schema.sql";
import { eq } from "drizzle-orm";

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId }) => {
    return await db
      .select()
      .from(account)
      .innerJoin(client, eq(account.clientId, client.clientId))
      .where(eq(client.agentId, userId));
  }
);
