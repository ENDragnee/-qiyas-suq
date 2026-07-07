declare global {
  namespace Express {
    interface User {
      id: string;
      name?: string;
      userName?: string;
      role: "user" | "admin";
    }
  }
}

export {}; // Ensure this is treated as a module
