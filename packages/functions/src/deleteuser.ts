import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function deleteUser(id: string, targetGroups: string[]) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw Error();
  }
  const deleteCommand = new AdminDeleteUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
  });
  await client.send(deleteCommand);
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ evt, userGroup }) => {
    const input = schema.parse(evt.body);
    const allowedToDelete = [Resource.UserGroups.agent];
    if (userGroup === Resource.UserGroups.rootAdmin) {
      allowedToDelete.push(Resource.UserGroups.admin);
    }
    await deleteUser(input.id, allowedToDelete);
  }
);
