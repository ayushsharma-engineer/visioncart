export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** field -> message, from FastAPI 422 validation errors. */
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** The backend has no endpoint for this yet. Never retried, never faked. */
export class NotConnectedError extends Error {
  readonly domain: string;
  readonly needs: string[];

  constructor(domain: string, needs: string[] = []) {
    super(`${domain} is not connected to the backend yet.`);
    this.name = "NotConnectedError";
    this.domain = domain;
    this.needs = needs;
  }
}

export function isNotConnected(e: unknown): e is NotConnectedError {
  return e instanceof NotConnectedError;
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

const GENERIC: Record<number, string> = {
  400: "That request wasn't valid.",
  401: "Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  422: "Some of the details look wrong.",
  429: "Too many attempts. Please wait a moment and try again.",
};

/**
 * The VisionCart backend returns THREE different error shapes today:
 *   1. AppException handler:   { success:false, error:{ code, message } }
 *   2. FastAPI HTTPException:  { detail: "message" }
 *   3. Pydantic validation:    { detail: [ { loc:[..,"field"], msg, type } ] }  (422)
 * plus non-JSON bodies on unhandled 500s. All are normalised to ApiError.
 */
export function normalizeErrorBody(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;

    const err = b.error;
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      const message = typeof e.message === "string" ? e.message : GENERIC[status];
      const code = typeof e.code === "string" ? e.code : `HTTP_${status}`;
      return new ApiError(status, code, message ?? "Something went wrong.");
    }

    const detail = b.detail;
    if (typeof detail === "string") {
      return new ApiError(status, `HTTP_${status}`, detail);
    }
    if (Array.isArray(detail)) {
      const fields: Record<string, string> = {};
      const messages: string[] = [];
      for (const item of detail) {
        if (!item || typeof item !== "object") continue;
        const it = item as { loc?: unknown; msg?: unknown };
        const msg = typeof it.msg === "string" ? it.msg : "Invalid value";
        const loc = Array.isArray(it.loc) ? it.loc : [];
        const field = String(loc[loc.length - 1] ?? "");
        if (field && field !== "body" && !(field in fields)) fields[field] = msg;
        messages.push(msg);
      }
      return new ApiError(
        status,
        "VALIDATION_ERROR",
        messages[0] ?? GENERIC[422],
        Object.keys(fields).length ? fields : undefined,
      );
    }
  }

  if (status >= 500) {
    return new ApiError(status, `HTTP_${status}`, "The server ran into a problem. Please try again in a moment.");
  }
  return new ApiError(status, `HTTP_${status}`, GENERIC[status] ?? "Something went wrong.");
}

export function describeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof NotConnectedError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}
