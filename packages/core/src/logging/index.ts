import { Resource } from "sst";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

export namespace Log {
  export async function createClient(data: Common) {
    await logLambdaRaw({
      ...data,
      crud: "create",
    });
  }

  export async function readClient(data: Common) {
    await logLambdaRaw({
      ...data,
      crud: "read",
    });
  }

  export async function deleteClient(data: Common) {
    await logLambdaRaw({
      ...data,
      crud: "delete",
    });
  }

  export async function updateClient(
    data: Common & { attributes: Record<string, AttributeValue> }
  ) {
    await logLambdaRaw({
      crud: "update",
      ...data,
    });
  }

  export async function sendEmail(data: {
    recipient: string;
    status: "sent" | "failed";
  }) {
    await logRaw("communication", {
      type: "email",
      ...data,
    });
  }

  type Common = {
    agentId: string;
    clientId: string;
  };

  type Create = "create";
  type Read = "read";
  type Delete = "delete";
  type Update = "update";

  type CRD = {
    crud: Create | Read | Delete;
  } & Common;

  type U = {
    crud: Update;
    attributes: Record<string, AttributeValue>;
  } & Common;

  export type AttributeValue = {
    beforeValue: unknown;
    afterValue: unknown;
  };

  type Data = CRD | U;

  type Output = {
    crud: Create | Read | Update | Delete;
    attributeName: string;
    beforeValue?: string;
    afterValue?: string;
  } & Common;

  async function logLambdaRaw(data: Data) {
    let output: Output;
    switch (data.crud) {
      case "update":
        output = {
          crud: data.crud,
          agentId: data.agentId,
          attributeName: Object.keys(data.attributes).join("|"),
          clientId: data.clientId,
          afterValue: Object.values(data.attributes)
            .map((val) => JSON.stringify(val.afterValue))
            .join("|"),
          beforeValue: Object.values(data.attributes)
            .map((val) => JSON.stringify(val.beforeValue))
            .join("|"),
        };
        break;
      case "read":
      case "create":
      case "delete":
        output = {
          crud: data.crud,
          agentId: data.agentId,
          attributeName: data.clientId,
          clientId: data.clientId,
        };
    }
    await logRaw("lambda", output);
  }
}

async function logRaw(groupName: string, data: object) {
  const payload = {
    group: groupName,
    data,
  };
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.LoggingQueue.url,
      MessageBody: JSON.stringify(payload),
    })
  );
}
