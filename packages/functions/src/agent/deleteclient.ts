import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./database/validators";
import { Log } from "@itsa-project/core/logging";

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId }) => {
    const deleted = await db
      .delete(client)
      .where(eq(client.agentId, userId))
      .returning()
      .execute()
      .then((row) => row[0]);
    if (deleted) {
      await Log.deleteClient({
        agentId: userId,
        clientId: deleted.id,
      });
    }
  }
);
