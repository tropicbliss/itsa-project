import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { account, client } from "./database/schema.sql";
import { and, eq } from "drizzle-orm";
import { clientIdSchema } from "./database/validators";
import { VisibleError } from "@itsa-project/core/errors/visibleError";

const schema = z.object({
  id: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    await db.transaction(async (tx) => {
      const isUserAllowedToModifyClient = await tx
        .select()
        .from(client)
        .where(and(eq(client.id, input.id), eq(client.agentId, userId)))
        .limit(1)
        .execute()
        .then((row) => row.length > 0);
      if (!isUserAllowedToModifyClient) {
        throw new VisibleError(
          "User does not have permission to modify this client"
        );
      }
      await tx.delete(account).where(eq(account.id, input.id)).execute();
    });
  }
);
