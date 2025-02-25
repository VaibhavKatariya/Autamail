"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Logs</CardTitle>
            <Button disabled>
              <Skeleton className="w-16 h-6" />
            </Button>
          </div>
          <Skeleton className="mt-2 h-10 w-full" />
        </CardHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {["Sender", "Template", "Recipient Name", "Recipient Email", "Status", "Date"].map((header, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-6 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(6)].map((_, i) => (
                      <TableCell key={i}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
