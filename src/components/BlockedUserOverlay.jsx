"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function BlockedUserOverlay() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleDelete();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      await fetch("/api/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      // Firebase SDK auto signs out when user is deleted
      router.replace("/");
    } catch (err) {
      console.error("Failed to delete user:", err);
      router.replace("/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 text-white p-6 rounded-xl w-[90%] max-w-md text-center space-y-4 border border-red-500">
        <h2 className="text-xl font-bold text-red-400">
          College Email Required
        </h2>

        <p className="text-sm text-zinc-300">
          You must sign in using your official college email:
          <br />
          <span className="font-mono text-white">
            @mail.jiit.ac.in
          </span>
        </p>

        <p className="text-sm text-zinc-400">
          This account will be removed in{" "}
          <span className="font-bold text-red-400">
            {secondsLeft}
          </span>{" "}
          seconds.
        </p>

        <Button
          variant="destructive"
          className="w-full"
          disabled
        >
          Removing account…
        </Button>
      </div>
    </div>
  );
}
