import "express-session";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
    user: {
      id: string;
      userName?: string;
      name?: string;
      role: "user" | "admin";
    };
  }
}
