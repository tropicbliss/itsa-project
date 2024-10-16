import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import { eq, and } from "drizzle-orm";
import { clientIdSchema } from "./database/validators";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { VisibleError } from "@itsa-project/core/errors";

const s3Client = new S3Client({ region: Resource.Region.name });

const schema = z.object({
  clientId: clientIdSchema,
  contentType: z.enum(["image/jpeg", "application/pdf", "image/png"]),
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const clientExists = await db
      .select()
      .from(client)
      .where(and(eq(client.id, input.clientId), eq(client.agentId, userId)))
      .limit(1)
      .execute()
      .then((result) => result.length > 0);
    if (!clientExists) {
      throw new VisibleError("Agent is not responsible for client");
    }
    const command = new PutObjectCommand({
      Bucket: Resource.Uploads.name,
      Key: `/verifyClient/${input.clientId}`,
      ContentType: input.contentType,
    });
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    });
    console.log(JSON.stringify(input));
    return { url };
  }
);
