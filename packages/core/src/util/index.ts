import { Context, APIGatewayProxyEvent } from "aws-lambda";

export module Util {
  export function handler(
    allowedGroups: string[],
    lambda: (evt: APIGatewayProxyEvent, context: Context) => Promise<string>
  ) {
    return async function (event: APIGatewayProxyEvent, context: Context) {
      let body: string, statusCode: number;
      const isAllowed = isUserAllowed(event, allowedGroups);
      if (isAllowed) {
        try {
          body = await lambda(event, context);
          statusCode = 200;
        } catch (error) {
          statusCode = 500;
          body = JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        statusCode = 403;
        body = "User does not have sufficient privileges to call this function";
      }
      return {
        body,
        statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
      };
    };
  }
}

function isUserAllowed(
  event: APIGatewayProxyEvent,
  allowedGroups: string[]
): boolean {
  if (allowedGroups.length === 0) {
    return true;
  }
  const partOfGroups: Set<String> = new Set(
    JSON.parse(
      Buffer.from(
        event.headers.authorization!.split(".")[1],
        "base64"
      ).toString()
    )["cognito:groups"]
  );
  return haveIntersection(new Set(allowedGroups), partOfGroups);
}

function haveIntersection(setA: Set<String>, setB: Set<String>) {
  return [...setA].some((item) => setB.has(item));
}
