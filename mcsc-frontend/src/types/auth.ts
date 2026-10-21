export type User = {
  id: number;
  username: string;
  email?: string;
  role: "admin" | "officer";
};

export type LoginRequest = {
  stationId: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};