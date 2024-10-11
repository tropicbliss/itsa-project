import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { db } from "../database/drizzle";
import { account, client } from "../database/schema.sql";
import { eq, and } from "drizzle-orm";

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId }) => {
    const response = await db
      .select({ account })
      .from(account)
      .innerJoin(client, eq(account.clientId, client.clientId))
      .where(
        and(eq(client.agentId, userId), eq(account.accountStatus, "active"))
      )
      .execute();
    return response.map((row) => row.account);
  }
);
