"use client";

import { createContext, useContext, useState } from "react";
import { toast } from "sonner";

const UsersDataContext = createContext(null);

export function UsersDataProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAllOnce = async () => {
    if (loaded || loading) return;

    try {
      setLoading(true);

      const [usersRes, pendingRes] = await Promise.all([
        fetch("/api/users?page=1"),
        fetch("/api/manageUsers"),
      ]);

      const usersData = await usersRes.json();
      const pendingData = await pendingRes.json();

      setUsers(usersData.users || []);
      setPendingUsers(pendingData.users || []);
      setLoaded(true);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS
  const addApprovedUser = (user) => {
    setUsers((prev) => {
      if (prev.some((u) => u.uid === user.uid)) return prev;
      return [user, ...prev];
    });
  };

  return (
    <UsersDataContext.Provider
      value={{
        users,
        pendingUsers,
        setUsers,
        setPendingUsers,
        addApprovedUser, // ✅ EXPOSE IT
        fetchAllOnce,
        loaded,
        loading,
      }}
    >
      {children}
    </UsersDataContext.Provider>
  );
}

export const useUsersData = () => useContext(UsersDataContext);
