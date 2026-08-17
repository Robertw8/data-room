export interface AuthPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (credentials: AuthPayload) => Promise<void>;
  register: (credentials: AuthPayload) => Promise<void>;
  logout: () => void;
}
