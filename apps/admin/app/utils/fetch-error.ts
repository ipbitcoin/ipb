/** Cast-free narrowing helpers for $fetch/H3 error payloads. */

function getProp(value: unknown, key: string): unknown {
  if (value !== null && typeof value === "object" && key in value) {
    return Reflect.get(value, key);
  }
  return undefined;
}

/** `err.data.message` when present. */
export function fetchErrorMessage(err: unknown): string | undefined {
  const message = getProp(getProp(err, "data"), "message");
  return typeof message === "string" ? message : undefined;
}

/** `err.data.error.message` (Stripe-style nested payloads). */
export function fetchErrorNestedMessage(err: unknown): string | undefined {
  const message = getProp(getProp(getProp(err, "data"), "error"), "message");
  return typeof message === "string" ? message : undefined;
}

export function fetchErrorStatus(err: unknown): number | undefined {
  const statusCode = getProp(err, "statusCode");
  return typeof statusCode === "number" ? statusCode : undefined;
}
