"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, authLoading] = useAuthState(auth);

  const [role, setRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const loadClaims = async () => {
      if (!firebaseUser) {
        setRole(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(firebaseUser);
        setRole(tokenResult.claims.role || "user");
      } catch (error) {
        console.error("Failed to read custom claims:", error);
        setRole("user");
      } finally {
        setCheckingAuth(false);
      }
    };

    loadClaims();
  }, [firebaseUser]);

  const value = {
    user: firebaseUser,
    role,
    isAdmin: role === "admin",
    loading: authLoading || checkingAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
