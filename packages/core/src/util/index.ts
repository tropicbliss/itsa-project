import { Context, APIGatewayProxyEvent } from "aws-lambda";

export type UtilOptions = {
  allowedGroups?: string[];
};

export type Input = {
  evt: APIGatewayProxyEvent;
  context: Context;
  userGroup: string;
};

export module Util {
  export function handler(
    options: UtilOptions,
    lambda: (input: Input) => Promise<object | void>
  ) {
    return async function (event: APIGatewayProxyEvent, context: Context) {
      const { allowedGroups } = options;
      let body: object | void, statusCode: number;
      const userInGroup = getUserGroup(event);
      const isAllowed = allowedGroups?.includes(userInGroup) ?? true;
      if (isAllowed) {
        try {
          body = await lambda({ evt: event, context, userGroup: userInGroup });
          statusCode = 200;
        } catch (error) {
          statusCode = 500;
          body = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      } else {
        statusCode = 403;
        body = {
          error:
            "User does not have sufficient privileges to call this function",
        };
      }
      return {
        body: body ? JSON.stringify(body) : "",
        statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
      };
    };
  }
}

function getUserGroup(event: APIGatewayProxyEvent): string {
  return JSON.parse(
    Buffer.from(event.headers.authorization!.split(".")[1], "base64").toString()
  )["cognito:groups"][0];
}
