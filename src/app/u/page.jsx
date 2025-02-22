"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/u/dashboard");
  }, [router]);

  return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
}
