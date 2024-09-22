import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { account } from "./utils/schema.sql";
import { eq } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";

const schema = z.object({
  id: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body }) => {
    const input = schema.parse(body);
    await db.delete(account).where(eq(account.accountId, input.id)).execute();
  }
);
