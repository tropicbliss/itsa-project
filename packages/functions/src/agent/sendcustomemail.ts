import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import { eq } from "drizzle-orm";
import { Log } from "@itsa-project/core/logging";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { VisibleError } from "@itsa-project/core/errors";

const sesClient = new SESv2Client();

const schema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ userId, body }) => {
    const input = schema.parse(body);
    const recipientEmail = await db
      .select({ email: client.emailAddress })
      .from(client)
      .where(eq(client.agentId, userId))
      .limit(1)
      .execute()
      .then((row) => row[0]);
    if (recipientEmail === undefined) {
      throw new VisibleError("Agent has no client");
    }
    try {
      await sesClient.send(
        new SendEmailCommand({
          FromEmailAddress: Resource.RootUserEmail.value,
          Destination: {
            ToAddresses: [Resource.RootUserEmail.value],
          },
          Content: {
            Simple: {
              Subject: {
                Data: input.subject,
              },
              Body: {
                Text: {
                  Data: input.body,
                },
              },
            },
          },
        })
      );
      Log.sendEmail({
        recipient: recipientEmail.email,
        status: "sent",
      });
    } catch (error) {
      console.error(error);
      Log.sendEmail({
        recipient: recipientEmail.email,
        status: "failed",
      });
    }
  }
);
