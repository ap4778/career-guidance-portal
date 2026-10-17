import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    try {
      const result = await api("/auth/me");
      setUser(result.user);
      setError("");
      return result.user;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setError("");
        return null;
      }
      setError(cause.message || "Could not connect to the backend.");
      throw cause;
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {}).finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setError("Your session expired. Please sign in again.");
    };
    window.addEventListener("careerpath:session-expired", handleSessionExpired);
    return () => window.removeEventListener("careerpath:session-expired", handleSessionExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await api("/auth/login", { method: "POST", body: credentials });
    setUser(result.user);
    setError("");
    return result.user;
  }, []);

  const register = useCallback(async (details) => {
    const result = await api("/auth/register", { method: "POST", body: details });
    setUser(result.user);
    setError("");
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, register, logout, refreshUser }), [user, loading, error, login, register, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
