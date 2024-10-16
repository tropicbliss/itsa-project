import {
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
} from "aws-lambda";
import { VisibleError } from "../errors";
import { ZodError } from "zod";

export type UtilOptions = {
  allowedGroups?: string[];
};

export type Input = {
  body?: unknown;
  userGroup: string;
  userId: string;
  queryParams?: APIGatewayProxyEventQueryStringParameters;
};

export namespace Util {
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
            body: event.body && JSON.parse(event.body),
            userGroup: userInGroup,
            userId: event.requestContext.authorizer!.jwt.claims.username,
            queryParams: event.queryStringParameters ?? undefined,
          });
          statusCode = 200;
        } catch (error) {
          statusCode = 400;
          if (error instanceof VisibleError) {
            body = {
              error: error.message,
            };
          } else if (error instanceof ZodError) {
            const errors = error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            }));
            body = {
              error: errors,
            };
          } else {
            console.error(error);
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
