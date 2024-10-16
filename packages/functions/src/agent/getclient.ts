import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import { eq } from "drizzle-orm";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { VisibleError } from "@itsa-project/core/errors";
import { Log } from "@itsa-project/core/logging";

const s3Client = new S3Client({ region: Resource.Region.name });

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId }) => {
    const clientRow = await db
      .select()
      .from(client)
      .where(eq(client.agentId, userId))
      .limit(1)
      .execute()
      .then((result) => result[0]);
    const isVerified = await s3Client
      .send(
        new HeadObjectCommand({
          Bucket: Resource.Uploads.name,
          Key: `/verifyClient/${clientRow.id}`,
        })
      )
      .then((_) => true)
      .catch((err) => {
        if (err instanceof Error && err.name === "NotFound") {
          return false;
        } else {
          throw err;
        }
      });
    if (clientRow === undefined) {
      throw new VisibleError("Client id not found");
    }
    await Log.readClient({
      agentId: userId,
      clientId: clientRow.id,
    });
    return { ...clientRow, isVerified };
  }
);
