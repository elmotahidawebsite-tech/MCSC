export const ROLES = {
  ADMIN: "admin",
  OFFICER: "officer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];