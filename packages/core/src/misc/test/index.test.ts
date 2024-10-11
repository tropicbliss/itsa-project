import { expect, test } from "vitest";
import { UUID } from "../";

test("test uuid file name check", () => {
  expect(
    UUID.isValidUUIDJson("123e4567-e89b-12d3-a456-426614174000.json")
  ).toBe(true);
  expect(UUID.isValidUUIDJson("123e4567-e89b-12d3-a456-426614174000.txt")).toBe(
    false
  );
  expect(UUID.isValidUUIDJson("invalid-uuid.json")).toBe(false);
  expect(UUID.isValidUUIDJson("123e4567-e89b-12d3-a456-426614174000json")).toBe(
    false
  );
});
