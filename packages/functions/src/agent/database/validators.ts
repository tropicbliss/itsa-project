import { z } from "zod";
import isAlpha from "validator/es/lib/isAlpha";
import isBefore from "validator/es/lib/isBefore";
import isAfter from "validator/es/lib/isAfter";
import isPhoneNumber from "validator/es/lib/isMobilePhone";
import isCurrencyCode from "validator/es/lib/isISO4217";
import isPostalCodeInner, {
  PostalCodeLocale,
} from "validator/es/lib/isPostalCode";
import { isPostalCodeLocales } from "validator";

function isCountryCode(input: string) {
  isPostalCodeLocales.includes(input as PostalCodeLocale);
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function subtractYearsFromToday(years: number) {
  const today = new Date();
  return new Date(today.setFullYear(today.getFullYear() - years));
}

export const clientIdSchema = z.string().uuid();
export const accountTypeSchema = z.enum(["savings", "checking", "business"]);
export const openingDateSchema = z.string().refine(isBefore);
export const initialDepositSchema = z.number().nonnegative();
export const currencySchema = z.string().refine(isCurrencyCode);
export const branchIdSchema = z.string();

export const firstNameSchema = z
  .string()
  .min(2)
  .max(50)
  .refine((input) =>
    isAlpha(input, undefined, {
      ignore: " ",
    })
  );
export const lastNameSchema = z
  .string()
  .min(2)
  .max(50)
  .refine((input) =>
    isAlpha(input, undefined, {
      ignore: " ",
    })
  );
export const dateOfBirthSchema = z
  .string()
  .refine((input) => isBefore(input, formatDate(subtractYearsFromToday(18))))
  .refine((input) => isAfter(input, formatDate(subtractYearsFromToday(100))));
export const genderSchema = z.enum([
  "male",
  "female",
  "non-binary",
  "prefer not to say",
]);
export const emailAddressSchema = z.string().email();
export const phoneNumberSchema = z.string().refine((input) =>
  isPhoneNumber(input, undefined, {
    strictMode: true,
  })
);
export const addressSchema = z.string().min(5).max(100);
export const citySchema = z.string().min(2).max(50);
export const stateSchema = z.string().min(2).max(50);
export const countrySchema = z.string().length(2);

export function isPostalCode(input: string, countryCode: string) {
  return isPostalCodeInner(input, countryCode as any);
}
