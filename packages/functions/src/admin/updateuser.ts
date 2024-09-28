import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { VisibleError } from "@itsa-project/core/util/visibleError";

const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function updateUser(
  id: string,
  targetGroups: string[],
  email: string,
  firstName: string,
  lastName: string
) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to update user in group");
  }
  const updateUser = new AdminUpdateUserAttributesCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "given_name",
        Value: firstName,
      },
      {
        Name: "family_name",
        Value: lastName,
      },
    ],
  });
  await client.send(updateUser);
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ body, userGroup }) => {
    const input = schema.parse(body);
    const allowedToUpdate = [Resource.UserGroups.agent];
    if (userGroup === Resource.UserGroups.rootAdmin) {
      allowedToUpdate.push(Resource.UserGroups.admin);
    }
    await updateUser(
      input.id,
      allowedToUpdate,
      input.email,
      input.firstName,
      input.lastName
    );
  }
);
