import { cookies } from "next/headers";
import crypto from "node:crypto";

const CSRF_COOKIE = "csrf_token";

export async function issueCsrf(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be false so client can read it
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

export async function assertCsrf(formToken?: string) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;

  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("CSRF validation:", { cookieToken: cookieToken?.substring(0, 10), formToken: formToken?.substring(0, 10), match: cookieToken === formToken });
  }

  if (!cookieToken || !formToken || cookieToken !== formToken) {
    throw new Error("CSRF token inválido");
  }
}