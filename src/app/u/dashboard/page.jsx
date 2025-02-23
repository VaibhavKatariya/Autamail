"use client";

import React from 'react';
import SponsorEmailDashboard from '@/components/NormalDashboard';
import AdminDashboard from '@/components/admin-dashboard';
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  const { user, loading, isAdmin, checkingAuth } = useAuth();
  console.log(isAdmin)
  const router = useRouter();

  if (loading || checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    router.push("/");
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className='dark:text-white flex flex-col md:flex-row items-center justify-center w-full h-screen p-4'>
      {isAdmin ? (
        <>
          <AdminDashboard />
          <SponsorEmailDashboard fromEmail={user?.email} />
        </>
      ) : (
        <SponsorEmailDashboard fromEmail={user?.email} />
      )}
    </div>
  );
};

export default Page;
