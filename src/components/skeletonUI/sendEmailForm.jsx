import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SendEmailFormSkeleton() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            <Skeleton className="h-6 w-48 mx-auto" />
          </CardTitle>
          <CardDescription className="text-center">
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bulk" className="w-full">
            <TabsContent value="bulk">
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="space-y-2 border p-4 rounded-lg flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Button disabled className="w-full mt-2">
                  <Skeleton className="h-10 w-full" />
                </Button>
                <div className="mt-1">
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Button disabled className="w-full mt-2">
                  <Skeleton className="h-10 w-full" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
