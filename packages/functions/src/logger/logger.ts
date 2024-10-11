import { Resource } from "sst";
import { z } from "zod";
import { Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const schema = z.object({
  crud: z.enum(["create", "read", "update", "delete"]),
  attributeName: z.string(),
  beforeValue: z.any(),
  afterValue: z.any(),
  agentId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export async function handler(event: any, _: Context) {
  const body = JSON.stringify(event);
  const input = schema.parse(body);
  await dynamoDb.send(
    new PutCommand({
      TableName: Resource.Logs.name,
      Item: {
        ...input,
        datetime: new Date().toISOString(),
      },
    })
  );
}
