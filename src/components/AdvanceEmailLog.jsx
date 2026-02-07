"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AdvancedSearch({ onUserFound }) {
  const { user } = useAuth();

  const [searchType, setSearchType] = useState("enrollment");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) return;

    try {
      setLoading(true);

      const token = await user.getIdToken();

      const res = await fetch("/api/findUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: searchType,
          value: searchValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      onUserFound(data);
    } catch (err) {
      toast.error(err.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Advanced Email Log Search</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollment">Roll Number</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={`Enter ${searchType}`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
