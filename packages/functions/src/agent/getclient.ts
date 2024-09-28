import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { client } from "./utils/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";
import { NotFoundError } from "@itsa-project/core/util/visibleError";

const schema = z.object({
  id: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const result = await db
      .select()
      .from(client)
      .where(and(eq(client.clientId, input.id), eq(client.agentId, userId)));
    const row = result[0];
    if (row === undefined) {
      throw new NotFoundError("Client id not found");
    }
    return row;
  }
);
