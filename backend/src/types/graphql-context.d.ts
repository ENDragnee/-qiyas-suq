export interface ContextUser {
  id: string;
  userName?: string;
  name?: string;
  shopId?: string;
  role: "admin" | "user";
}

export interface Context {
  user?: ContextUser;
}
