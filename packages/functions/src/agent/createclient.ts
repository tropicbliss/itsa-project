import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { archive, client } from "./database/schema.sql";
import {
  addressSchema,
  citySchema,
  countrySchema,
  dateOfBirthSchema,
  emailAddressSchema,
  firstNameSchema,
  genderSchema,
  isPostalCode,
  lastNameSchema,
  phoneNumberSchema,
  stateSchema,
} from "./database/validators";
import { eq, and, or, sql } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/errors";
import { Log } from "@itsa-project/core/logging";

const schema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    dateOfBirth: dateOfBirthSchema,
    gender: genderSchema,
    emailAddress: emailAddressSchema,
    phoneNumber: phoneNumberSchema,
    address: addressSchema,
    city: citySchema,
    state: stateSchema,
    countryCode: countrySchema,
    postalCode: z.string(),
  })
  .refine((data) => isPostalCode(data.postalCode, data.countryCode));

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const response = await db.transaction(async (tx) => {
      const [hasPreexistingClients, hasDuplicateInfo] = await Promise.all([
        tx
          .select()
          .from(client)
          .where(eq(client.agentId, userId))
          .limit(1)
          .execute()
          .then((row) => row.length > 0),
        tx
          .select()
          .from(archive)
          .where(
            and(
              eq(archive.table, "client"),
              or(
                sql`${archive.data} ->> 'email_address' = ${input.emailAddress}`,
                sql`${archive.data} ->> 'phone_number' = ${input.phoneNumber}`
              )
            )
          )
          .limit(1)
          .execute()
          .then((row) => row.length > 0),
      ]);
      if (hasPreexistingClients) {
        throw new VisibleError(
          "An agent can only be responsible for one client"
        );
      }
      if (hasDuplicateInfo) {
        throw new VisibleError(
          "System already includes an email or phone number that is the same"
        );
      }
      return await tx
        .insert(client)
        .values({
          ...input,
          agentId: userId,
        })
        .returning()
        .execute();
    });
    const clientId = response[0].id;
    await Log.createClient({
      agentId: userId,
      clientId,
    });
    return { id: clientId };
  }
);
