export const OneDay = 1000 * 60 * 60 * 24;

export const UUIDNil = "00000000-0000-0000-0000-000000000000";

export function randomID() {
  return Math.random().toString(36).substr(2, 9);
}
