import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "@/api";

import type { AuthContextValue, AuthPayload, User } from "@/types";

const AuthContext = createContext<AuthContextValue | null>(null);

const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const authenticate = async (
    request: () => Promise<{ accessToken: string }>,
  ) => {
    try {
      const { accessToken } = await request();

      localStorage.setItem("accessToken", accessToken);

      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem("accessToken");
      setUser(null);

      throw error;
    }
  };

  const login = (credentials: AuthPayload) => {
    return authenticate(() => loginRequest(credentials));
  };

  const register = (credentials: AuthPayload) => {
    return authenticate(() => registerRequest(credentials));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;
