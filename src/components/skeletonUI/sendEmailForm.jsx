"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SendEmailFormSkeleton() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-lg">
        {/* Header */}
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-6">
          {/* Upload CSV */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* OR */}
          <div className="flex justify-center">
            <Skeleton className="h-4 w-10" />
          </div>

          {/* Add Recipient */}
          <Skeleton className="h-10 w-36 rounded-md" />

          {/* Email Template */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Queue Button */}
          <Skeleton className="h-10 w-40 rounded-md opacity-60" />
        </CardContent>
      </Card>
    </div>
  );
}
