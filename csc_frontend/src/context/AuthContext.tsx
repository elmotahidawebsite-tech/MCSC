import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { fetchMe, login as loginApi, logout as logoutApi } from "../api/auth";
import type { LoginRequest, User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // بيتنفذ أول ما التطبيق يفتح
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  async function login(data: LoginRequest): Promise<User> {
    await loginApi(data);        // بيبعت البيانات وبيحفظ التوكنات
    const me = await fetchMe();  // بيسأل الباك اند: أنا مين؟
    setUser(me);
    return me;
  }

  function logout() {
    logoutApi();

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}