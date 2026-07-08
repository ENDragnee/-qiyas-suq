export interface Context {
  session?: {
    id: string;
    userName: string;
    name: string;
    shopId: string;
    role: "admin" | "user";
  };
}
