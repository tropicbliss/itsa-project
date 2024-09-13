import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { client } from "./utils/schema.sql";
import { eq } from "drizzle-orm";

const schema = z.object({
  id: z.string(),
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent, Resource.UserGroups.rootAdmin],
  },
  async ({ evt }) => {
    const input = schema.parse(JSON.parse(evt.body!));
    await db.delete(client).where(eq(client.clientId, input.id)).execute();
  }
);
