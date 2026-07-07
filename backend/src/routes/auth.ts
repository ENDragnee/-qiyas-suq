import { Router } from "express";
import passport from "passport";
import { Signup } from "@/contorllers/auth/signup";
import { ResetPassword } from "@/contorllers/auth/reset-password";

export const authRoutes = Router();

authRoutes.post("/api/auth/signup", Signup);

authRoutes.post(
  "/api/auth/login",
  passport.authenticate("local"),
  (req, res) => {
    res.status(200).json({
      message: "User loged in",
      user: req.user,
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
