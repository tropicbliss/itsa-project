import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { account, client } from "./database/schema.sql";
import {
  accountTypeSchema,
  branchIdSchema,
  clientIdSchema,
  currencySchema,
  initialDepositSchema,
  openingDateSchema,
} from "./database/validators";
import { and, eq } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/errors";

const schema = z.object({
  clientId: clientIdSchema,
  type: accountTypeSchema,
  openingDate: openingDateSchema,
  initialDeposit: initialDepositSchema.transform((num) => num.toString()),
  currency: currencySchema,
  branchId: branchIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const response = await db.transaction(async (tx) => {
      const isUserAllowedToModifyClient = await tx
        .select()
        .from(client)
        .where(and(eq(client.id, input.clientId), eq(client.agentId, userId)))
        .limit(1)
        .execute()
        .then((row) => row.length > 0);
      if (!isUserAllowedToModifyClient) {
        throw new VisibleError(
          "User does not have permission to modify this client"
        );
      }
      return await tx
        .insert(account)
        .values({
          ...input,
          status: "pending",
        })
        .returning()
        .execute();
    });
    console.log(JSON.stringify(input));
    return { id: response[0].id };
  }
);
