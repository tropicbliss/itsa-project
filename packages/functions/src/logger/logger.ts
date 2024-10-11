import { Resource } from "sst";
import { z } from "zod";
import { Context, SQSEvent, SQSBatchResponse } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { splitByPredicate } from "./utils/utils";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const schema = z.object({
  crud: z.enum(["create", "read", "update", "delete"]),
  attributeName: z.string(),
  beforeValue: z.any(),
  afterValue: z.any(),
  agentId: z.string().uuid(),
  clientId: z.string().uuid(),
  datetime: z.string().datetime(),
});

export async function handler(
  event: SQSEvent,
  _: Context
): Promise<SQSBatchResponse> {
  const inputs = event.Records.map((record) => ({
    messageId: record.messageId,
    payload: schema.safeParse(JSON.stringify(record.body)),
  }));
  const [successes, failures] = splitByPredicate(
    inputs,
    (input) => input.payload.success
  );
  const failedMessages = failures.map((failedMsg) => failedMsg.messageId);
  const response = await dynamoDb.send(
    new BatchWriteCommand({
      RequestItems: {
        [Resource.Logs.name]: successes.map((parsed) => ({
          PutRequest: {
            Item: { ...parsed.payload.data!, id: parsed.messageId },
          },
        })),
      },
    })
  );
  if (response.UnprocessedItems) {
    const unprocessedIds = response.UnprocessedItems[Resource.Logs.name].map(
      (item) => item.PutRequest!.Item!["id"] as string
    );
    failedMessages.push(...unprocessedIds);
  }
  return {
    batchItemFailures: failedMessages.map((id) => ({
      itemIdentifier: id,
    })),
  };
}
