'use client'
import React, { useEffect, useState } from 'react';
import SponsorEmailDashboard from '@/components/NormalDashboard';
import AdminDashboard from '@/components/admin-dashboard';
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, rtdb } from "@/lib/firebase";
import { ref, get } from "firebase/database";

const Page = () => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user) {
        try {
          const adminRef = ref(rtdb, "admins");
          const snapshot = await get(adminRef);

          if (snapshot.exists()) {
            const adminList = snapshot.val(); // Assuming admin list is an array of emails
            if (adminList.includes(user.email)) {
              setIsAdmin(true);
            }
          }
        } catch (err) {
          console.error("Error fetching admin data:", err);
        }
        setCheckingAuth(false);
      } else if (!loading && !user) {
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  if (checkingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
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
    </>
  );
};

export default Page;
