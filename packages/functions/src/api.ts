import { Util } from "@itsa-project/core/util";

export const handler = Util.handler(["rootadmin"], async (event) => {
  return "Hello, world!";
});
