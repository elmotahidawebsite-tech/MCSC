
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import axios from "axios";

import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  saveOfflineUser,
  getOfflineUser,
} from "../api/auth";

import type { LoginRequest, User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

function clearLocalSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("csc_offline_user");
}

function isAuthRejected(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 401 ||
      error.response?.status === 403)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      const token = localStorage.getItem("access");

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await fetchMe();

        if (cancelled) return;

        saveOfflineUser(me);
        setUser(me);
      } catch (error: unknown) {
        if (cancelled) return;

        if (isNetworkError(error)) {
          // No response from the server: try restoring the local user.
          const offlineUser = getOfflineUser();
          setUser(offlineUser);
        } else if (isAuthRejected(error)) {
          // The server rejected authentication.
          clearLocalSession();
          setUser(null);
        } else {
          // Server error or another unexpected failure.
          // Keep the existing session for a later retry.
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(data: LoginRequest): Promise<User> {
  await loginApi(data);
  console.log("1. LOGIN SUCCESS");

  try {
    const me = await fetchMe();
    console.log("2. USER FROM API:", me);

    saveOfflineUser(me);

    console.log(
      "3. SAVED USER:",
      localStorage.getItem("csc_offline_user")
    );

    setUser(me);
    return me;
  } catch (error) {
    console.error("FETCH ME ERROR:", error);
    throw error;
  }
}

  function logout() {
    logoutApi();
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
