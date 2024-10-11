import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./database/validators";

const schema = z.object({
  id: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    await db
      .delete(client)
      .where(and(eq(client.id, input.id), eq(client.agentId, userId)))
      .execute();
  }
);
