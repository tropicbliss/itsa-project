export namespace UUID {
  export function isValidUUIDJson(filename: string) {
    const uuidJsonRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i;
    return uuidJsonRegex.test(filename);
  }
}
