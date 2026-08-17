import api from "./api-client";
import type { AuthPayload, AuthResponse, User } from "@/types";

const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ sub: string; email: string }>("/auth/me");

  return {
    id: response.data.sub,
    email: response.data.email,
  };
};

const register = async ({
  email,
  password,
}: AuthPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", {
    email,
    password,
  });

  return response.data;
};

const login = async ({
  email,
  password,
}: AuthPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export { getCurrentUser, register, login };
