import { sql } from "drizzle-orm";
import { db } from "./database/drizzle";
import { account } from "./database/schema.sql";

export const handler = async (_: any) => {
  const randomAccount = await db
    .select({ id: account.id })
    .from(account)
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .execute();
  if (randomAccount.length === 0) {
    return { id: null }
  }
  return { id: randomAccount[0].id };
};
