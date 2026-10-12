import type { LoginRequest, LoginResponse, User } from "../types/auth";
import { ROLES } from "../constants/roles";

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const users: (User & { stationId: string })[] = [
  {
    id: 1,
    username: "admin",
    stationId: "admin",
    role: ROLES.ADMIN,
  },
  {
    id: 2,
    username: "officer",
    stationId: "user",
    role: ROLES.OFFICER,
  },
];

export async function mockLogin(
  data: LoginRequest
): Promise<LoginResponse> {
  await delay(1000);

  const user = users.find(
    (u) =>
      u.stationId === data.stationId &&
      data.password === "12345678"
  );

  if (!user) {
    throw new Error("Invalid Station ID or Password");
  }

  localStorage.setItem("stationId", user.stationId);

  return {
    access: "fake-access-token",
    refresh: "fake-refresh-token",
  };
}

export async function mockFetchMe(): Promise<User> {
  await delay(500);

  const stationId = localStorage.getItem("stationId");

  const user = users.find((u) => u.stationId === stationId);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}