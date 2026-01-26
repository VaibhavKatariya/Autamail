"use client";

import { useAuth } from "@/context/AuthContext";
import BlockedUserOverlay from "@/components/BlockedUserOverlay";

export default function ClientGuards({ children }) {
  const { blocked } = useAuth();

  return (
    <>
      {children}
      {blocked && <BlockedUserOverlay />}
    </>
  );
}
