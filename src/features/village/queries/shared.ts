export function isMissingDatabaseRelationError(message: string | null | undefined) {
  return Boolean(
    message?.includes("Could not find the table") ||
      message?.includes('relation "public.') && message?.includes("does not exist")
  );
}

export function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}
