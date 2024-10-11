import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z } from "zod";
import { db } from "./database/drizzle";
import { client } from "./database/schema.sql";
import {
  addressSchema,
  citySchema,
  clientIdSchema,
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
import { eq, and } from "drizzle-orm";

const schema = z
  .object({
    clientId: clientIdSchema,
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    dateOfBirth: dateOfBirthSchema.optional(),
    gender: genderSchema.optional(),
    emailAddress: emailAddressSchema.optional(),
    phoneNumber: phoneNumberSchema.optional(),
    address: addressSchema.optional(),
    city: citySchema.optional(),
    state: stateSchema.optional(),
    countryCode: countrySchema.optional(),
    postalCode: z.string().optional(),
  })
  .refine((data) => {
    if (data.postalCode === undefined) {
      return true;
    }
    if (data.countryCode) {
      return isPostalCode(data.postalCode, data.countryCode);
    }
    return false;
  });

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    await db
      .update(client)
      .set({
        ...input,
      })
      .where(and(eq(client.id, input.clientId), eq(client.agentId, userId)))
      .execute();
  }
);
