import { Router } from "express";
import passport from "passport";
import { Signup } from "@/contorllers/auth/signup";
import { ResetPassword } from "@/contorllers/auth/reset-password";
import { GetMe } from "@/contorllers/auth/me";
import { createUserSchema } from "@/schemas/user.schema";
import { validate } from "@/middleware/validate";

export const authRoutes = Router();

authRoutes.post("/api/auth/signup", validate(createUserSchema), Signup);

authRoutes.post(
  "/api/auth/login",
  passport.authenticate("local"),
  (req, res) => {
    // Strip the bcrypt password hash from the response (Follow-up Fix 4): same
    // leak as /api/auth/me (ARCHITECTURE §10 #9). `req.user` is the full Mongoose
    // doc returned by Passport's deserializeUser; convert to a plain object and
    // drop `password` before sending. Pure subtraction — the session was already
    // established inside passport.authenticate (serializeUser ran there, before
    // this handler), so the cookie, session creation, and deserializeUser are
    // untouched; all other user fields (id, name, userName, role, shopId, …) are
    // preserved for the frontend, which reads `user.shopId` after login.
    const user = req.user as unknown as { toObject?: () => Record<string, unknown> };
    const userObj =
      typeof user.toObject === "function"
        ? user.toObject()
        : { ...(req.user as unknown as Record<string, unknown>) };
    const { password: _password, ...safeUser } = userObj;

    res.status(200).json({
      message: "User loged in",
      user: safeUser,
    });
  },
);

authRoutes.post("/api/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect("/");
  });
});

authRoutes.patch("/api/auth/reset-password", ResetPassword);

authRoutes.get("/api/auth/me", GetMe);
