export function extractErrorMessage(error: unknown) {
  console.error(error);
  let errorDescription: string;
  if (error instanceof Error) {
    errorDescription = error.message;
  } else {
    errorDescription = String(error);
  }
  return errorDescription;
}
