import type { Request, Response } from "express";

/* Minimal authenticated-session check used by the frontend's getSession().
   Returns 200 { user } when logged in, 401 otherwise. Shape matches what
   frontend/lib/session.ts expects (reads json.user ?? json.data). */
export async function GetMe(req: Request, res: Response) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "User is not logged in" });
  }

  // Strip the bcrypt password hash from the response (Fix 1): the session user
  // is a full Mongoose doc, so convert to a plain object and drop `password`
  // before sending. This is a pure subtraction from the response shape — the
  // auth flow, session logic, and User schema are untouched.
  const user = req.user as unknown as { toObject?: () => Record<string, unknown> };
  const userObj =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...(req.user as unknown as Record<string, unknown>) };
  const { password: _password, ...safeUser } = userObj;

  return res.status(200).json({ user: safeUser });
}
