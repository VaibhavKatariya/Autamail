'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function AccessRequestFormSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Request Access to the Site</CardTitle>
          <p className="text-sm text-gray-500">
            Please fill out the form below to request access.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment Number</Label>
              <Input id="enrollment" type="text" placeholder="Ex: 992310XXXX" required />
            </div>
            <Button type="submit" className="w-full">
              Request Access
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Under Review</AlertDialogTitle>
            <AlertDialogDescription>
              Your request has been submitted and is under review. Please check back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
