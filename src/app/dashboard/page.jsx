"use client";

import SendEmailForm from "@/components/sendEmailForm";
import SendEmailFormSkeleton from "@/components/skeletonUI/sendEmailForm";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SendEmailFormSkeleton />;
  }

  return (
    <div className="dark:text-white flex flex-col md:flex-row items-center justify-center w-full h-screen p-4">
      <SendEmailForm fromEmail={user.email} />
    </div>
  );
}
