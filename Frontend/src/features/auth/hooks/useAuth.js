import { useContext } from "react";
import AuthContext from "../auth.context";
import {
  loginUser,
  registerUser,
  logoutUser,
} from "../services/auth.api";

// Hook layer – bridges the API service layer and the state (context) layer
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, loading } = context;

  // ── Actions ───────────────────────────────────────────

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    if (data.success) {
      setUser(data.user); // update global state
    }
    return data;
  };

  const register = async (username, email, password) => {
    const data = await registerUser(username, email, password);
    // Don't auto-set user here — redirect to /login after registration
    return data;
  };

  const logout = async () => {
    const data = await logoutUser();
    setUser(null); // clear global state
    return data;
  };

  // ── Return values ─────────────────────────────────────

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
};

export default useAuth;
