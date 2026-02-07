"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const EmailLogsContext = createContext(null);

export function EmailLogsProvider({ children }) {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const fetchLogs = useCallback(
    async (reset = false) => {
      if (!user) return;

      try {
        setLoading(true);

        const token = await user.getIdToken();

        const url =
          reset || !cursor
            ? "/api/emailLogs"
            : `/api/emailLogs?cursor=${cursor}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setLogs(reset ? data.emails : (prev) => [...prev, ...data.emails]);
        setCursor(data.nextCursor || null);
        setInitialized(true);
      } catch (err) {
        toast.error(err.message || "Failed to load email logs");
      } finally {
        setLoading(false);
      }
    },
    [user, cursor]
  );

  const refreshLogs = useCallback(() => {
    return fetchLogs(true);
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    if (cursor) {
      return fetchLogs(false);
    }
  }, [cursor, fetchLogs]);

  const value = {
    logs,
    loading,
    cursor,
    initialized,
    fetchLogs,
    refreshLogs,
    loadMore,
  };

  return (
    <EmailLogsContext.Provider value={value}>
      {children}
    </EmailLogsContext.Provider>
  );
}

export function useEmailLogs() {
  const context = useContext(EmailLogsContext);
  if (!context) {
    throw new Error("useEmailLogs must be used within EmailLogsProvider");
  }
  return context;
}