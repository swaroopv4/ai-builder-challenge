"use client";

export type Role = "tech" | "manager";

const COOKIE_NAME = "asset-challenge-role";
const ROLE_USERS: Record<Role, string> = {
  tech: "tech-jane",
  manager: "manager-paul",
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [k, v] = c.trim().split("=");
    if (k === name) return decodeURIComponent(v ?? "");
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
}

export function getRole(): Role {
  const v = readCookie(COOKIE_NAME);
  return v === "manager" ? "manager" : "tech";
}

export function setRole(role: Role): void {
  writeCookie(COOKIE_NAME, role);
}

export function toggleRole(): Role {
  const next: Role = getRole() === "tech" ? "manager" : "tech";
  setRole(next);
  return next;
}

export function getCurrentUserId(): string {
  return ROLE_USERS[getRole()];
}

export function roleUserId(role: Role): string {
  return ROLE_USERS[role];
}
