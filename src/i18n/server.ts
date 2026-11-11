import { cookies } from "next/headers";
import { LANG_COOKIE, isLang, type Lang } from "./dictionary";

// Server-only: reads the language cookie for SSR. Never import from a
// client component (it would pull next/headers into the client bundle).
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "nl";
}
