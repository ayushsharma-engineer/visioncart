export type Validator = (value: string) => string | null;

export const required =
  (label: string): Validator =>
  (v) =>
    v.trim() ? null : `${label} is required`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const email: Validator = (v) => (EMAIL.test(v.trim()) ? null : "Enter a valid email address");

export const password: Validator = (v) =>
  v.length >= 8 ? null : "Use at least 8 characters";

/** 10-digit Indian mobile, optional +91 / 0 prefix. */
export const indianPhone: Validator = (v) => {
  const d = v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)/, "");
  return /^[6-9]\d{9}$/.test(d) ? null : "Enter a valid 10-digit mobile number";
};

/** Generic international phone: 7–15 digits. */
export const phone: Validator = (v) => {
  const d = v.replace(/[\s()-]/g, "").replace(/^\+/, "");
  return /^\d{7,15}$/.test(d) ? null : "Enter a valid phone number";
};

export const indianPincode: Validator = (v) =>
  /^[1-9]\d{5}$/.test(v.trim()) ? null : "Enter a valid 6-digit PIN code";

export function firstError(value: string, validators: Validator[]): string | null {
  for (const fn of validators) {
    const err = fn(value);
    if (err) return err;
  }
  return null;
}
