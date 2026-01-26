"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AccessRequestFormSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Confirm Your Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Name */}
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </div>

          {/* Email */}
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-full" />
          </div>

          {/* Enrollment */}
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>

          {/* Button */}
          <Button disabled className="w-full mt-4">
            Loading...
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
