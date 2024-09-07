import { Handler } from "aws-lambda";
import { Resource } from "sst";

export const handler: Handler = async (_event) => {
  return {
    statusCode: 200,
    body: Resource.Region.region,
  };
};
