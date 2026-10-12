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
}

export async function fetchMe(): Promise<User> {
  const response = await api.get<User>("/auth/me/");
  return response.data;
}