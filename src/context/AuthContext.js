"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true); // Force refresh token
          const role = tokenResult.claims.role; // Get role from custom claims
          
          setIsAdmin(role === "admin"); // Set isAdmin based on role
        } catch (err) {
          console.error("Error fetching user claims:", err);
        }
      }
      setCheckingAuth(false);
    };

    checkUserRole();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, checkingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
