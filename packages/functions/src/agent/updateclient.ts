import { Util } from "@itsa-project/core/util";
import { Resource } from "sst";
import { z, ZodError } from "zod";
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
import { Log } from "@itsa-project/core/logging";
import { VisibleError } from "@itsa-project/core/errors";

const schema = z.object({
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
});

export const handler = Util.handler(
  {
    allowedGroups: [Resource.UserGroups.agent],
  },
  async ({ body, userId }) => {
    const input = schema.parse(body);
    const rowBeforeUpdate = await db.transaction(async (tx) => {
      const result = await tx
        .select()
        .from(client)
        .where(eq(client.agentId, userId))
        .execute()
        .then((rows) => rows[0]);
      if (result === undefined) {
        return undefined;
      }
      const countryCodeToCheck = input.countryCode ?? result.countryCode;
      const postalCodeToCheck = input.postalCode ?? result.postalCode;
      if (!isPostalCode(postalCodeToCheck, countryCodeToCheck)) {
        throw new VisibleError("Postal code is not valid given country code");
      }
      await tx
        .update(client)
        .set({
          ...input,
        })
        .where(eq(client.agentId, userId))
        .execute();
      return result;
    });
    if (rowBeforeUpdate === undefined) {
      return;
    }
    let attributes: Record<string, Log.AttributeValue> = {};
    Object.keys(input).forEach((key) => {
      attributes[key] = {
        beforeValue: rowBeforeUpdate[key as keyof typeof rowBeforeUpdate],
        afterValue: input[key as keyof typeof input],
      };
    });
    await Log.updateClient({
      agentId: userId,
      clientId: rowBeforeUpdate.id,
      attributes,
    });
  }
);
