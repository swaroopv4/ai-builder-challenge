import type { Location } from "./types";

const EMPTY_LOCATION: Location = {
  site: "",
  room: null,
  row: null,
  rack: null,
  ru: null,
};

export type LocationParseResult =
  | { ok: true; location: Location; raw: string }
  | { ok: false; error: string; raw: string };

function clean(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeRu(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/^u/i, "").trim() || null;
}

export function normalizeLocation(input: Partial<Location>): Location {
  return {
    site: clean(input.site) ?? "",
    room: clean(input.room),
    row: clean(input.row),
    rack: clean(input.rack),
    ru: normalizeRu(clean(input.ru)),
  };
}

function fromJson(raw: string): Location | null {
  if (!raw.startsWith("{")) return null;
  const parsed = JSON.parse(raw) as Partial<Location>;
  return normalizeLocation(parsed);
}

function fromKeyValues(raw: string): Location | null {
  if (!raw.includes("=")) return null;
  const parts = raw.split(/[;&]/g);
  const location: Partial<Location> = {};
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.split("=");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join("=").trim();
    if (!key) continue;
    if (key === "site") location.site = value;
    if (key === "room") location.room = value;
    if (key === "row") location.row = value;
    if (key === "rack") location.rack = value;
    if (key === "ru" || key === "u") location.ru = value;
  }
  return normalizeLocation(location);
}

function fromSlash(raw: string): Location | null {
  if (!raw.includes("/")) return null;
  const [site, room, third, fourth, fifth] = raw
    .split("/")
    .map((part) => part.trim());
  if (!site || !room) return null;

  if (fifth) {
    return normalizeLocation({
      site,
      room,
      row: third,
      rack: fourth,
      ru: fifth,
    });
  }

  return normalizeLocation({
    site,
    room,
    rack: third ?? null,
    ru: fourth ?? null,
  });
}

export function parseLocationScan(raw: string): LocationParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Scan or enter a location before continuing.", raw };
  }

  try {
    const location =
      fromJson(trimmed) ?? fromKeyValues(trimmed) ?? fromSlash(trimmed);
    if (!location || !location.site) {
      return {
        ok: false,
        error:
          "Location scan needs at least a site and room, such as Irvine/Storage A.",
        raw,
      };
    }
    return { ok: true, location, raw };
  } catch {
    return {
      ok: false,
      error:
        "Location scan was not readable. Use JSON, site=... pairs, or Irvine/B12/R4/U12.",
      raw,
    };
  }
}

export function deployLocationMissing(location: Location): string[] {
  const missing: string[] = [];
  if (!location.site) missing.push("site");
  if (!location.room) missing.push("room");
  if (!location.rack) missing.push("rack");
  if (!location.ru) missing.push("RU");
  return missing;
}

export function isDeployLocationComplete(location: Location): boolean {
  return deployLocationMissing(location).length === 0;
}

export function mergeLocation(base: Location | null, update: Partial<Location>): Location {
  return normalizeLocation({ ...(base ?? EMPTY_LOCATION), ...update });
}

export function formatLocation(location: Location | null | undefined): string {
  if (!location) return "No location recorded";
  const parts = [location.site, location.room, location.row, location.rack, displayRu(location.ru)]
    .filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" / ") : "No location recorded";
}

export function formatRackLocation(location: Location): string {
  const parts = [location.site, location.room, location.row, location.rack, displayRu(location.ru)]
    .filter((part): part is string => Boolean(part));
  return parts.join("/");
}

function displayRu(ru: string | null | undefined): string | null {
  if (!ru) return null;
  return /^u/i.test(ru) ? ru.toUpperCase() : `U${ru}`;
}

export function normalizeRackComparable(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\/u/g, "/")
    .replace(/(^|\/)u(?=\d)/g, "$1");
}
