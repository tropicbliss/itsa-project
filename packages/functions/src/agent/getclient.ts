import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { account, client } from "./utils/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";
import { NotFoundError } from "@itsa-project/core/util/visibleError";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: Resource.Region.name });

const schema = z.object({
  id: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const [clientRow, accounts, isVerified] = await Promise.all([
      db
        .select()
        .from(client)
        .where(and(eq(client.clientId, input.id), eq(client.agentId, userId)))
        .limit(1)
        .execute()
        .then((result) => result[0]),
      db.select().from(account).where(eq(account.clientId, input.id)).execute(),
      s3Client
        .send(
          new HeadObjectCommand({
            Bucket: Resource.Uploads.name,
            Key: `/verifyClient/${input.id}`,
          })
        )
        .then((_) => true)
        .catch((err) => {
          if (err instanceof Error && err.name === "NotFound") {
            return false;
          } else {
            throw err;
          }
        }),
    ]);
    if (clientRow === undefined) {
      throw new NotFoundError("Client id not found");
    }
    return { isVerified, accounts, client: clientRow };
  }
);
