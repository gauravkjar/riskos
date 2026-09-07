export type Role = "INVESTOR" | "ADVISOR" | "ADMIN" | "RISK_ADMIN" | "MODEL_ADMIN";

export interface SessionPayload {
  userId: string;
  role: Role;
  exp: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}
