"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

export default function AdvancedSearch({ onUserFound }) {
  const [searchType, setSearchType] = useState("email"); // Default to email
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate email if searchType is "email"
    if (searchType === "email" && !validateEmail(searchValue)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where(searchType, "==", searchValue));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No user found with this " + searchType);
        setLoading(false);
        return;
      }

      // Assuming one user per email/rollNumber; take the first match
      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;
      const userData = { uid, ...userDoc.data() };

      onUserFound(userData); // Pass the found user data to the parent
    } catch (err) {
      setError("Error searching for user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10vh)] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Advanced Email Log Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center gap-2">
              <span>Find Log(s) by user's:</span>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="rollNumber">Roll Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="text"
              placeholder={`Enter ${searchType === "email" ? "email" : "roll number"}`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            {error && <p className="text-red-500">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}