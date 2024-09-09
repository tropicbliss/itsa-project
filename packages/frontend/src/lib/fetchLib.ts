import { API, Auth } from "aws-amplify";

export async function get(path: string) {
  const session = await Auth.currentSession();
  const res = await API.get("api", path, {
    headers: {
      Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`,
    },
  });
  return res;
}
