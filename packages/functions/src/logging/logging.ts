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
    const payload = schema.parse(JSON.parse(record.body));
    const groupName = payload.group;
    const data = payload.data;
    const timestamp = new Date(record.attributes.SentTimestamp);
    if (!(groupName in logGroups)) {
      logGroups[groupName] = [];
    }
    logGroups[groupName].push({
      message: JSON.stringify(data),
      timestamp: timestamp.getTime(),
    });
  }
  for (const groupName in logGroups) {
    if (logGroups.hasOwnProperty(groupName)) {
      await logRaw(groupName, "main", logGroups[groupName]);
    }
  }
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
