import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
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
import { eq } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/errors/visibleError";
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
    const response = await db.transaction(async (tx) => {
      const hasPreexistingClients = await tx
        .select()
        .from(client)
        .where(eq(client.agentId, userId))
        .limit(1)
        .execute()
        .then((row) => row.length > 0);
      if (hasPreexistingClients) {
        throw new VisibleError(
          "An agent can only be responsible for one client"
        );
      }
      const input = schema.parse(body);
      return await tx
        .insert(client)
        .values({
          ...input,
          agentId: userId,
        })
        .returning()
        .execute();
    });
    await Log.createClient({
      agentId: userId,
      clientId: response[0].id,
    });
  }
);
