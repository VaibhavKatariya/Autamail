"use client";
import SendEmailForm from '@/components/sendEmailForm';
import SendEmailFormSkeleton from '@/components/skeletonUI/sendEmailForm';
import { useAuth } from "@/context/AuthContext";

const page = () => {
    const { user, loading, checkingAuth } = useAuth();

    if (loading || checkingAuth) {
        return <SendEmailFormSkeleton />
    }

    return (
        <div className='dark:text-white flex flex-col md:flex-row items-center justify-center w-full h-screen p-4'>
            <SendEmailForm fromEmail={user?.email} />
        </div>
    )
}

export default page