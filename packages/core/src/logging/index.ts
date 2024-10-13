import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { Resource } from "sst";

const client = new CloudWatchLogsClient({ region: Resource.Region.name });

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

  export async function sendEmail(
    data: {
      recipient: string;
      status: "sent" | "failed";
    },
    timestamp: string
  ) {
    await logRaw(
      Resource.CommunicationLogGroup.name,
      { type: "email", ...data },
      new Date(timestamp)
    );
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
    const logGroup = Resource.LambdaLogGroup.name;
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
    await logRaw(Resource.LambdaLogGroup.name, output);
  }
}

async function logRaw(groupName: string, data: object, timestamp?: Date) {
  const LOG_STREAM_NAME = "main";
  await client.send(
    new CreateLogStreamCommand({
      logGroupName: groupName,
      logStreamName: LOG_STREAM_NAME,
    })
  );
  const { logStreams } = await client.send(
    new DescribeLogStreamsCommand({
      logGroupName: groupName,
      logStreamNamePrefix: LOG_STREAM_NAME,
    })
  );
  const sequenceToken =
    logStreams && logStreams.length > 0
      ? logStreams[0].uploadSequenceToken
      : undefined;
  await client.send(
    new PutLogEventsCommand({
      logGroupName: groupName,
      logStreamName: LOG_STREAM_NAME,
      logEvents: [
        {
          message: JSON.stringify(data),
          timestamp: (timestamp ?? new Date()).getTime(),
        },
      ],
      sequenceToken,
    })
  );
}
