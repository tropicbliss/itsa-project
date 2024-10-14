import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
  AdminUpdateUserAttributesCommand,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { VisibleError } from "@itsa-project/core/errors";

const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function updateUser(
  id: string,
  targetGroups: string[],
  email?: string,
  firstName?: string,
  lastName?: string
) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to update user in group");
  }
  const UserAttributes: AttributeType[] = [];
  if (email !== undefined) {
    UserAttributes.push({
      Name: "email",
      Value: email,
    });
  }
  if (firstName !== undefined) {
    UserAttributes.push({
      Name: "given_name",
      Value: firstName,
    });
  }
  if (lastName !== undefined) {
    UserAttributes.push({
      Name: "family_name",
      Value: lastName,
    });
  }
  const updateUser = new AdminUpdateUserAttributesCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
    UserAttributes,
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
