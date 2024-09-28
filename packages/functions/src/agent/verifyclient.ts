import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { client } from "./utils/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./utils/validators";
import { NotFoundError } from "@itsa-project/core/util/visibleError";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PassThrough } from "stream";

const s3Client = new S3Client({ region: Resource.Region.name });

const schema = z.object({
  clientId: clientIdSchema,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, event, userId }) => {
    const input = schema.parse(body);
    const clientExists = await db
      .select()
      .from(client)
      .where(
        and(eq(client.clientId, input.clientId), eq(client.agentId, userId))
      )
      .limit(1)
      .then((result) => result.length > 0);
    if (!clientExists) {
      throw new NotFoundError("Client id not found");
    }
    const fileContent = Buffer.from(event.body!, "base64");
    const fileStream = new PassThrough();
    fileStream.end(fileContent);
    const key = `/verifyClient/${input.clientId}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: Resource.Uploads.name,
        Key: key,
        Body: fileStream,
      })
    );
    await db
      .update(client)
      .set({
        isVerified: true,
      })
      .where(eq(client.clientId, input.clientId));
    return {
      url: `https://${Resource.Uploads.name}.s3.amazonaws.com/${key}`,
    };
  }
);
