import { Resource } from "sst";
import { z } from "zod";
import { Context, SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

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

export async function handler(event: SQSEvent, _: Context) {
  const inputs = event.Records.map((record) =>
    schema.parse(JSON.stringify(record.body))
  );
  await dynamoDb.send(
    new BatchWriteCommand({
      RequestItems: {
        [Resource.Logs.name]: inputs.map((input) => ({
          PutRequest: {
            Item: input,
          },
        })),
      },
    })
  );
}
