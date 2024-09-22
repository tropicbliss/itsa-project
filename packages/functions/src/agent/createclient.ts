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
  async ({ body }) => {
    const input = schema.parse(body);
    await db.insert(client).values({
      ...input,
    });
  }
);
