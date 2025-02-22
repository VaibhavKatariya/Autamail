'use client'
import React from 'react'
import SponsorEmailDashboard from '@/components/email'
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const page = () => {

  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, loading, router]);

  if (checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  return (
    <SponsorEmailDashboard />
  )
}

export default page