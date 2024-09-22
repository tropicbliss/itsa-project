import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { account } from "./utils/schema.sql";
import { accountStatusSchema, accountTypeSchema, branchIdSchema, clientIdSchema, currencySchema, initialDepositSchema, openingDateSchema } from "./utils/validators";

const schema = z.object({
  clientId: clientIdSchema,
  accountType: accountTypeSchema,
  accountStatus: accountStatusSchema,
  openingDate: openingDateSchema,
  initialDeposit: initialDepositSchema,
  currency: currencySchema,
  branchId: branchIdSchema
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body }) => {
    const input = schema.parse(body);
    await db.insert(account).values({
      ...input
    })
  }
);
