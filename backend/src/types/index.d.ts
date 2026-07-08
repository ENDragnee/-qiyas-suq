import { Types } from "mongoose";

declare global {
  namespace Express {
    interface User {
      id: string;
      name?: string;
      userName?: string;
      role: "user" | "admin";
      shopId: Types.ObjectId;
    }
  }
}

export {}; // Ensure this is treated as a module
