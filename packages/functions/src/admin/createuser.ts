import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { VisibleError } from "@itsa-project/core/util/visibleError";
import { randomUUID } from "crypto";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "agent"]),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ evt, userGroup }) => {
    const input = schema.parse(JSON.parse(evt.body!));
    if (userGroup === Resource.UserGroups.admin && input.role === "admin") {
      throw new VisibleError("An admin cannot create another admin user");
    }
    const id = randomUUID();
    const createUserCommand = new AdminCreateUserCommand({
      Username: id,
      UserPoolId: Resource.UserPool.id,
      UserAttributes: [
        {
          Name: "email",
          Value: input.email,
        },
        {
          Name: "given_name",
          Value: input.firstName,
        },
        {
          Name: "family_name",
          Value: input.lastName,
        },
      ],
    });
    await client.send(createUserCommand);
    let rawGroupName: string;
    switch (input.role) {
      case "admin":
        rawGroupName = Resource.UserGroups.admin;
        break;
      case "agent":
        rawGroupName = Resource.UserGroups.agent;
    }
    const assignGroupCommand = new AdminAddUserToGroupCommand({
      GroupName: rawGroupName,
      Username: id,
      UserPoolId: Resource.UserPool.id,
    });
    await client.send(assignGroupCommand);
    return { id };
  }
);
