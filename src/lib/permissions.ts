import type { StudioRole } from "./types";

export function canDraft(role: StudioRole) {
  return role === "sales" || role === "admin";
}

export function canLockRates(role: StudioRole) {
  return role === "finance" || role === "admin";
}

export function canManageUsers(role: StudioRole) {
  return role === "admin";
}

export function canViewOps(role: StudioRole) {
  return role === "finance" || role === "admin";
}

export function roleLabel(role: StudioRole) {
  if (role === "sales") return "Sales";
  if (role === "finance") return "Finance";
  return "Admin";
}
