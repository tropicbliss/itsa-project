import Client from "ssh2-sftp-client";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { transactions } from "./database/schema.sql";
import { initialDepositSchema } from "./database/validators";
import { UUID } from "@itsa-project/core/misc";

const sftp = new Client();

const baseFilePath = `/home/${Resource.MainframeUsername.value}/output`;

const schema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  type: z.enum(["D", "W"]),
  amount: initialDepositSchema.transform((num) => num.toString()),
  date: z.string().date(),
  status: z.enum(["completed", "pending", "failed"]),
});

export const handler = async (_: any) => {
  await sftp.connect({
    host: Resource.MainframeIpAddress.value,
    port: 22,
    username: Resource.MainframeUsername.value,
    password: Resource.MainframePassword.value,
  });
  const fileList = (await sftp.list(`${baseFilePath}/processing`)).map(
    (file) => file.name
  );
  for (const file of fileList) {
    if (!UUID.isValidUUIDJson(file)) {
      continue;
    }
    const fileContent = (
      await sftp.get(`${baseFilePath}/processing/${file}`)
    ).toString();
    try {
      const parsed = schema.safeParse(JSON.parse(fileContent));
      if (parsed.success) {
        const data = parsed.data;
        await db
          .insert(transactions)
          .values({
            ...data,
          })
          .onConflictDoUpdate({
            target: transactions.id,
            set: {
              status: data.status,
            },
          })
          .execute();
        await sftp.rename(
          `${baseFilePath}/processing/${file}`,
          `${baseFilePath}/processed/${file}`
        );
      }
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        throw err;
      }
    }
  }
  await sftp.end();
};
