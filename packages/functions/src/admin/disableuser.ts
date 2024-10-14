import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { VisibleError } from "@itsa-project/core/errors";

const schema = z.object({
  id: z.string().uuid(),
  disable: z.boolean().default(true),
});

const client = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function disableUser(id: string, targetGroups: string[]) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to disable user in group");
  }
  const disableCommand = new AdminDisableUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
  });
  await client.send(disableCommand);
}

async function enableUser(id: string, targetGroups: string[]) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await client.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to enable user in group");
  }
  const disableCommand = new AdminEnableUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
  });
  await client.send(disableCommand);
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ body, userGroup }) => {
    const input = schema.parse(body);
    const allowedToDisable = [Resource.UserGroups.agent];
    if (userGroup === Resource.UserGroups.rootAdmin) {
      allowedToDisable.push(Resource.UserGroups.admin);
    }
    if (input.disable) {
      await disableUser(input.id, allowedToDisable);
    } else {
      await enableUser(input.id, allowedToDisable);
    }
  }
);
