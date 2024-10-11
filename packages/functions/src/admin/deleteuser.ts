import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { db } from "../database/drizzle";
import { client } from "../database/schema.sql";
import { eq } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/errors/visibleError";

const schema = z.object({
  id: z.string().uuid(),
});

const cognitoClient = new CognitoIdentityProviderClient({
  region: Resource.Region.name,
});

async function deleteUser(id: string, targetGroups: string[]) {
  const checkCommand = new AdminListGroupsForUserCommand({
    Username: id,
    UserPoolId: Resource.UserPool.id,
  });
  const response = await cognitoClient.send(checkCommand);
  if (!targetGroups.includes(response.Groups![0].GroupName!)) {
    throw new VisibleError("Insufficient privilege to delete user in group");
  }
  const deleteCommand = new AdminDeleteUserCommand({
    UserPoolId: Resource.UserPool.id,
    Username: id,
  });
  await cognitoClient.send(deleteCommand);
  return response.Groups![0].GroupName!;
}

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.admin, Resource.UserGroups.rootAdmin],
  },
  async ({ body, userGroup }) => {
    const input = schema.parse(body);
    const allowedToDelete = [Resource.UserGroups.agent];
    if (userGroup === Resource.UserGroups.rootAdmin) {
      allowedToDelete.push(Resource.UserGroups.admin);
    }
    const groupDeleted = await deleteUser(input.id, allowedToDelete);
    if (groupDeleted === Resource.UserGroups.agent) {
      await db.delete(client).where(eq(client.agentId, input.id));
    }
  }
);
