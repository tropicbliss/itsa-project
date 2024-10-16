import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { account, client } from "./database/schema.sql";
import { and, eq } from "drizzle-orm";
import { clientIdSchema } from "./database/validators";
import { VisibleError } from "@itsa-project/core/errors";

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
      const isUserAllowedToDeleteAccount = await tx
        .select()
        .from(client)
        .innerJoin(account, eq(account.clientId, client.id))
        .where(and(eq(client.agentId, userId), eq(account.id, input.id)))
        .limit(1)
        .execute()
        .then((row) => row.length > 0);
      if (!isUserAllowedToDeleteAccount) {
        throw new VisibleError(
          "User does not have permission to modify this client"
        );
      }
      await tx.delete(account).where(eq(account.id, input.id)).execute();
    });
    console.log(JSON.stringify(input));
  }
);
