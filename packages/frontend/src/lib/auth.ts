import { Auth } from "aws-amplify";

export async function getUserGroups(): Promise<string[]> {
  const session = await Auth.currentSession();
  const idToken = session.getIdToken();
  const userGroups = idToken.payload["cognito:groups"] || [];
  return userGroups;
}
