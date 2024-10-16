import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { account, client, transactions } from "./database/schema.sql";
import { db } from "./database/drizzle";

const schema = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive(),
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId, queryParams }) => {
    const input = schema.parse(queryParams);
    const offset = (input.page - 1) * input.limit;
    const txnInformation = await db
      .select({ transactions })
      .from(account)
      .innerJoin(client, eq(account.clientId, client.id))
      .innerJoin(transactions, eq(account.id, transactions.accountId))
      .where(eq(client.agentId, userId))
      .orderBy(desc(transactions.insertedAt))
      .limit(input.limit)
      .offset(offset)
      .execute();
    return txnInformation.map((txn) => txn.transactions);
  }
);
