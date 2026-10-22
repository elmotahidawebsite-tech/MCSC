import { api } from "./client";
import type { LoginRequest, LoginResponse, User } from "../types/auth";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login/", {
    username: data.stationId,  // الـ Station ID اللي الضابط كاتبه = الـ username في الباك اند
    password: data.password,
  });

  localStorage.setItem("access", response.data.access);
  localStorage.setItem("refresh", response.data.refresh);

  return response.data;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("stationId");
  localStorage.removeItem("csc_offline_user");
}

export async function fetchMe(): Promise<User> {
  const response = await api.get<User>("/auth/me/");
  return response.data;
}



const OFFLINE_USER_KEY = "csc_offline_user";

export function saveOfflineUser(user: User) {
  localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
}

export function getOfflineUser(): User | null {
  try {
    const value = localStorage.getItem(OFFLINE_USER_KEY);

    if (!value) return null;

    const user: User = JSON.parse(value);

    if (
      typeof user.id !== "number" ||
      typeof user.username !== "string" ||
      !["admin", "officer"].includes(user.role)
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}