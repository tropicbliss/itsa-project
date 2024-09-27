import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { NotFoundError, VisibleError } from "./visibleError";
import { ZodError } from "zod";

export type UtilOptions = {
  allowedGroups?: string[];
};

export type Input = {
  body: unknown;
  userGroup: string;
  userId: string;
  event: APIGatewayProxyEvent;
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
            body: JSON.parse(event.body!),
            userGroup: userInGroup,
            userId: event.requestContext.authorizer!.jwt.claims.username,
            event,
          });
          statusCode = 200;
        } catch (error) {
          statusCode = 400;
          if (error instanceof VisibleError) {
            body = {
              error: error.message,
            };
            if (error instanceof NotFoundError) {
              statusCode = 404;
            }
          } else if (error instanceof ZodError) {
            const errors = error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            }));
            body = {
              error: errors,
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
