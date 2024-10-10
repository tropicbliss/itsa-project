import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./utils/drizzle";
import { client } from "./utils/schema.sql";
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
} from "./utils/validators";
import { eq } from "drizzle-orm";
import { VisibleError } from "@itsa-project/core/util/visibleError";

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
    const hasPreexistingClients = await db
      .select()
      .from(client)
      .where(eq(client.agentId, userId))
      .limit(1)
      .execute()
      .then((row) => row.length > 0);
    if (hasPreexistingClients) {
      throw new VisibleError("An agent can only be responsible for one client");
    }
    const input = schema.parse(body);
    await db
      .insert(client)
      .values({
        ...input,
        agentId: userId,
      })
      .execute();
  }
);
