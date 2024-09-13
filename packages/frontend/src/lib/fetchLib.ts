import { API, Auth } from "aws-amplify";

export async function get(path: string): Promise<unknown> {
  const session = await Auth.currentSession();
  const res = await API.get("api", path, {
    headers: {
      Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`,
    },
  });
  return res;
}

export async function del(path: string, payload: object): Promise<unknown> {
  const session = await Auth.currentSession();
  const res = await API.del("api", path, {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`,
      "Content-Type": "application/json",
    },
  });
  return res;
}
