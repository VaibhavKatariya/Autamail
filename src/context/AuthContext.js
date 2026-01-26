"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, authLoading] = useAuthState(auth);

  const [role, setRole] = useState(undefined); 
  // undefined = not loaded yet
  // null = loaded, but no role (pending)
  // "user" | "admin" = approved

  const [claimsLoaded, setClaimsLoaded] = useState(false);

  useEffect(() => {
    const loadClaims = async () => {
      if (!firebaseUser) {
        setRole(undefined);
        setClaimsLoaded(true);
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(firebaseUser, true);
        setRole(tokenResult.claims.role ?? null);
      } catch (err) {
        console.error("Failed to load claims", err);
        setRole(null);
      } finally {
        setClaimsLoaded(true);
      }
    };

    setClaimsLoaded(false);
    loadClaims();
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        role,
        isAdmin: role === "admin",
        loading: authLoading || !claimsLoaded,
        claimsLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
