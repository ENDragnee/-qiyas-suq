import session from "express-session";
export const sessionMiddleware = session({
  secret: Bun.env.SESSION_SECRET || "",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60000 * 60,
    secure: false,
  },
});
