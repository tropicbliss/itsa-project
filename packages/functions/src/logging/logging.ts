import { SQSHandler } from "aws-lambda";
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
  InputLogEvent,
} from "@aws-sdk/client-cloudwatch-logs";
import { Resource } from "sst";
import { z } from "zod";

const schema = z.object({
  group: z.string(),
  data: z.object({}).passthrough(),
});

const client = new CloudWatchLogsClient({ region: Resource.Region.name });

export const handler: SQSHandler = async (event) => {
  const logGroups: Record<string, InputLogEvent[]> = {};
  for (const record of event.Records) {
    const parsed = schema.safeParse(JSON.parse(record.body));
    if (parsed.success) {
      const payload = parsed.data;
      const groupName = payload.group;
      const data = payload.data;
      if (!(groupName in logGroups)) {
        logGroups[groupName] = [];
      }
      logGroups[groupName].push({
        message: JSON.stringify(data),
        timestamp: Number(record.attributes.SentTimestamp),
      });
    } else {
      console.error(parsed.error);
    }
  }
  await Promise.all(
    Object.entries(logGroups).map(([groupName, data]) =>
      logRaw(groupName, "main", data)
    )
  );
};

async function logRaw(
  groupName: string,
  streamName: string,
  data: InputLogEvent[]
) {
  const { logStreams } = await client.send(
    new DescribeLogStreamsCommand({
      logGroupName: groupName,
      logStreamNamePrefix: streamName,
    })
  );
  const sequenceToken =
    logStreams && logStreams.length > 0
      ? logStreams[0].uploadSequenceToken
      : undefined;
  await client.send(
    new PutLogEventsCommand({
      logGroupName: groupName,
      logStreamName: streamName,
      logEvents: data,
      sequenceToken,
    })
  );
}

export const dlq: SQSHandler = async (event) => {
  const logEvents: InputLogEvent[] = [];
  for (const record of event.Records) {
    const body = record.body;
    logEvents.push({
      message: body,
      timestamp: Number(record.attributes.SentTimestamp),
    });
  }
  await logRaw(
    Resource.DLQLogGroup.name,
    Resource.DLQLogStream.name,
    logEvents
  );
};
