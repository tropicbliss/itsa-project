import {
  type CustomEmailSenderForgotPasswordTriggerEvent,
  type CustomEmailSenderAdminCreateUserTriggerEvent,
} from "aws-lambda";
import {
  buildClient,
  CommitmentPolicy,
  KmsKeyringNode,
} from "@aws-crypto/client-node";
import { Resource } from "sst";
import b64 from "base64-js";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Log } from "@itsa-project/core/logging";

const client = new SESv2Client();

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);

export const handler = async (
  event:
    | CustomEmailSenderAdminCreateUserTriggerEvent
    | CustomEmailSenderForgotPasswordTriggerEvent
) => {
  if (event.request.code) {
    const generatorKeyId = Resource.EmailSenderKeyAlias.alias;
    const keyIds = [Resource.EmailSenderKey.arn];
    const keyring = new KmsKeyringNode({
      generatorKeyId,
      keyIds,
    });
    const { plaintext } = await decrypt(
      keyring,
      b64.toByteArray(event.request.code)
    );
    const temporaryPassword = plaintext.toString();
    const { given_name } = event.request.userAttributes;
    try {
      switch (event.triggerSource) {
        case "CustomEmailSender_AdminCreateUser":
          await client.send(
            new SendEmailCommand({
              FromEmailAddress: Resource.RootUserEmail.value,
              Destination: {
                ToAddresses: [Resource.RootUserEmail.value],
              },
              Content: {
                Simple: {
                  Subject: {
                    Data: "Temporary password",
                  },
                  Body: {
                    Text: {
                      Data: `Hi ${given_name},\nHere's your temporary password: ${temporaryPassword}`,
                    },
                  },
                },
              },
            })
          );
          break;
        case "CustomEmailSender_ForgotPassword":
          await client.send(
            new SendEmailCommand({
              FromEmailAddress: Resource.RootUserEmail.value,
              Destination: {
                ToAddresses: [Resource.RootUserEmail.value],
              },
              Content: {
                Simple: {
                  Subject: {
                    Data: "Reset your password",
                  },
                  Body: {
                    Text: {
                      Data: `Hi ${given_name},\nHere's your password reset code: ${temporaryPassword}`,
                    },
                  },
                },
              },
            })
          );
      }
      Log.sendEmail({
        recipient: event.request.userAttributes.email,
        status: "sent",
      });
    } catch (error) {
      console.error(error);
      Log.sendEmail({
        recipient: event.request.userAttributes.email,
        status: "failed",
      });
    }
  } else {
    console.warn("No event request code received");
  }
};
