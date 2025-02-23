"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, rtdb } from "@/lib/firebase";
import { ref, get } from "firebase/database";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminRef = ref(rtdb, "admins");
          const snapshot = await get(adminRef);
          if (snapshot.exists()) {
            const adminList = snapshot.val();
            setIsAdmin(adminList.includes(user.email));
          }
        } catch (err) {
          console.error("Error fetching admin data:", err);
        }
      }
      setCheckingAuth(false);
    };

    checkAdminStatus();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, checkingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
