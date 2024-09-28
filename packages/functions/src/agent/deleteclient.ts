import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { client } from "./utils/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";

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
      .where(and(eq(client.clientId, input.id), eq(client.agentId, userId)))
      .execute();
  }
);
