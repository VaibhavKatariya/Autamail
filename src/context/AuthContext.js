"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, authLoading] = useAuthState(auth);
  const [role, setRole] = useState(undefined);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!firebaseUser) {
        setRole(undefined);
        setCheckingAuth(false);
        return;
      }

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
        loading: authLoading || checkingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
