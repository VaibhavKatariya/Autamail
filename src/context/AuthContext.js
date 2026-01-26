"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, authLoading] = useAuthState(auth);

  const [role, setRole] = useState(undefined); // ⬅️ important
  const [blocked, setBlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!firebaseUser) {
        setRole(undefined);
        setBlocked(false);
        setCheckingAuth(false);
        return;
      }

      setBlocked(false);
      
      try {
        const token = await getIdTokenResult(firebaseUser);
        setRole(token.claims.role ?? null); 
      } catch {
        setRole(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    run();
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        role,                 
        isAdmin: role === "admin",
        blocked,
        loading: authLoading || checkingAuth,
      }}
    >
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
