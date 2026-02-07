"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

const QueuedEmailsContext = createContext(null);

export function QueuedEmailsProvider({ children }) {
  const [emails, setEmails] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadedOnceRef = useRef(false);

  const fetchQueuedEmails = useCallback(
    async ({ reset = false } = {}) => {
      if (loading) return;
      if (!reset && loadedOnceRef.current) return;
      if (loadedOnceRef.current && !reset && cursor === null) return;

      try {
        setLoading(true);

        const url = reset
          ? "/api/getQueuedEmails"
          : `/api/getQueuedEmails?cursor=${cursor}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setEmails((prev) => (reset ? data.emails : [...prev, ...data.emails]));
        setCursor(data.nextCursor || null);
        loadedOnceRef.current = true; // ✅ Set ref
      } finally {
        setLoading(false);
      }
    },
    [cursor, loading] // ✅ Removed loadedOnce from dependencies
  );

  const removeEmails = useCallback((ids) => {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
  }, []);

  const resetCache = useCallback(() => {
    setEmails([]);
    setCursor(null);
    loadedOnceRef.current = false;
  }, []);

  return (
    <QueuedEmailsContext.Provider
      value={{
        emails,
        cursor,
        loading,
        fetchQueuedEmails,
        removeEmails,
        resetCache,
      }}
    >
      {children}
    </QueuedEmailsContext.Provider>
  );
}

export const useQueuedEmails = () => {
  const ctx = useContext(QueuedEmailsContext);
  if (!ctx) {
    throw new Error("useQueuedEmails must be used inside QueuedEmailsProvider");
  }
  return ctx;
};