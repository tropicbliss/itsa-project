import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { account, client } from "./utils/schema.sql";
import {
  accountTypeSchema,
  branchIdSchema,
  clientIdSchema,
  currencySchema,
  initialDepositSchema,
  openingDateSchema,
} from "./utils/validators";
import { and, eq } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/util/visibleError";

const schema = z.object({
  clientId: clientIdSchema,
  accountType: accountTypeSchema,
  openingDate: openingDateSchema,
  initialDeposit: initialDepositSchema,
  currency: currencySchema,
  branchId: branchIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const isUserAllowedToModifyClient = await db
      .select()
      .from(client)
      .where(
        and(eq(client.clientId, input.clientId), eq(client.agentId, userId))
      )
      .limit(1)
      .execute()
      .then((row) => row.length > 0);
    if (!isUserAllowedToModifyClient) {
      throw new VisibleError(
        "User does not have permission to modify this client"
      );
    }
    await db
      .insert(account)
      .values({
        ...input,
        accountStatus: "active",
      })
      .execute();
  }
);
