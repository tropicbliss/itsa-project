import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { VisibleError } from "./visibleError";

export type UtilOptions = {
  allowedGroups?: string[];
};

export type Input = {
  evt: APIGatewayProxyEvent;
  context: Context;
  userGroup: string;
  userId: string;
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
          body = await lambda({
            evt: event,
            context,
            userGroup: userInGroup,
            userId: event.requestContext.authorizer!.jwt.claims.username,
          });
          statusCode = 200;
        } catch (error) {
          if (error instanceof VisibleError) {
            statusCode = 400;
            body = {
              error: error.message,
            };
          } else {
            statusCode = 500;
            body = {
              error: "Something went horribly wrong",
            };
          }
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
