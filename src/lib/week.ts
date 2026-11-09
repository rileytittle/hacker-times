import { cacheLife } from "next/cache";
import { mondayOf } from "./format";

/** Monday (unix seconds, UTC) of the current week. */
export async function getCurrentWeekStart(): Promise<number> {
  "use cache";
  cacheLife("hours");
  return mondayOf(Math.floor(Date.now() / 1000));
}
