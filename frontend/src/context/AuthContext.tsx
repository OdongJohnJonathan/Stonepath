"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usersApi, UserProfile } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if a token is already saved
  useEffect(() => {
    const savedToken = localStorage.getItem("sp_token");
    if (savedToken) {
      login(savedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (newToken: string) => {
    try {
      const profile = await usersApi.getMe(newToken);
      setToken(newToken);
      setUser(profile);
      localStorage.setItem("sp_token", newToken);
    } catch {
      // Token is invalid or expired — clear it
      logout();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sp_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}