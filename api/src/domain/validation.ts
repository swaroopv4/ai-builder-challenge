import { ASSET_TAG_REGEX } from "./types.js";
import type { Location } from "./types.js";

export function isValidTag(tag: string): boolean {
  return ASSET_TAG_REGEX.test(tag);
}

export function isDeployLocationComplete(loc: Location): boolean {
  return Boolean(loc.rack && loc.ru && loc.room && loc.site);
}
