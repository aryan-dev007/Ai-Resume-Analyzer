import { createContext, useState, useEffect } from "react";
import { getProfile } from "./services/auth.api";

// Pure state container – no action logic here
const AuthContext = createContext(null);

// Provider component – holds user state and runs session check on mount
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first mount, check if the user already has a valid session (cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getProfile();
        if (data.success) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Only raw state is exposed – actions live in hooks/useAuth.js
  const value = { user, setUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
