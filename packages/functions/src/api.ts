import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();

export const handler = Util.handler(
  {
    allowedGroups: ["rootadmin"],
  },
  async (event) => {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: Resource.EmailSendingService.sender,
        Destination: {
          ToAddresses: [Resource.EmailSendingService.sender],
        },
        Content: {
          Simple: {
            Subject: {
              Data: "Hello, world!",
            },
            Body: {
              Text: {
                Data: "Bonjour!",
              },
            },
          },
        },
      })
    );
    return "Sent!";
  }
);
