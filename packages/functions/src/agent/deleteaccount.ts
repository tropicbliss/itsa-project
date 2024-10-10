import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { account, client } from "./utils/schema.sql";
import { and, eq } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";
import { VisibleError } from "@itsa-project/core/util/visibleError";

const schema = z.object({
  id: clientIdSchema,
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
      .where(and(eq(client.clientId, input.id), eq(client.agentId, userId)))
      .limit(1)
      .execute()
      .then((row) => row.length > 0);
    if (!isUserAllowedToModifyClient) {
      throw new VisibleError(
        "User does not have permission to modify this client"
      );
    }
    await db.delete(account).where(eq(account.accountId, input.id)).execute();
  }
);
