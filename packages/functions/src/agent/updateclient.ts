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
import { type AttributeValue, Log } from "@itsa-project/core/logging";

const schema = z
  .object({
    id: clientIdSchema,
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
    const { id, ...inputWithoutId } = input;
    const rowBeforeUpdate = await db
      .select()
      .from(client)
      .where(and(eq(client.id, id), eq(client.agentId, userId)))
      .execute()
      .then((rows) => rows[0]);
    if (rowBeforeUpdate === undefined) {
      return;
    }
    await db
      .update(client)
      .set({
        ...inputWithoutId,
      })
      .where(and(eq(client.id, id), eq(client.agentId, userId)))
      .execute();
    let attributes: Record<string, AttributeValue> = {};
    Object.keys(input)
      .filter((field) => field !== "id")
      .forEach((key) => {
        attributes[key] = {
          beforeValue: rowBeforeUpdate[key as keyof typeof rowBeforeUpdate],
          afterValue: input[key as keyof typeof input],
        };
      });
    await Log.updateClient({
      agentId: userId,
      clientId: id,
      attributes,
    });
  }
);
