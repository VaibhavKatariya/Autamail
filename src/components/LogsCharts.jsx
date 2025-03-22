import { useEffect, useState } from "react";
import { db, rtdb } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref, get, set } from "firebase/database";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  failed: "#F44336",
  delivered: "#4CAF50",
  unknown: "#9E9E9E",
};

export default function EmailStatsPieChart({ isAdmin, userId }) {
  const [emailStats, setEmailStats] = useState({ delivered: [], failed: [], unknown: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        let stats = { delivered: [], failed: [], unknown: [] }; // Default empty structure

        const statsRef = isAdmin ? ref(rtdb, "emailStats") : ref(rtdb, `emailStats/users/${userId}`);
        const statsSnap = await get(statsRef);
        if (statsSnap.exists()) {
          stats = statsSnap.val();

          // If admin, remove the 'users' key from stats if it exists
          if (isAdmin && stats.users) {
            delete stats.users;
          }
        }

        setEmailStats(stats);

        // If no data is found, compute and store stats
        if (Object.values(stats).every((arr) => arr.length === 0)) {
          console.log("No existing stats found, computing fresh stats...");
          await computeAndStoreStats();
        }
      } catch (error) {
        console.error("Error fetching email stats:", error);
      } finally {
        setLoading(false);
      }
    }

    async function computeAndStoreStats() {
      try {
        console.log("Computing email stats...");
        const collectionPath = isAdmin ? "sentEmails" : `users/${userId}/sentEmails`;
        const sentEmailsRef = collection(db, collectionPath);
        const emailDocs = await getDocs(sentEmailsRef);

        let statsObj = { delivered: [], failed: [], unknown: [] };
        emailDocs.forEach((email) => {
          const status = email.data().status;
          const emailDocId = email.id; // Store only the doc ID
          if (statsObj[status]) {
            statsObj[status].push(emailDocId);
          }
        });

        const statsRef = isAdmin ? ref(rtdb, "emailStats") : ref(rtdb, `emailStats/users/${userId}`);
        await set(statsRef, statsObj);

        setEmailStats(statsObj);
      } catch (error) {
        console.error("Error computing email stats:", error);
      }
    }

    fetchStats();
  }, [isAdmin, userId]);

  if (loading) return <p>Loading...</p>;
  if (!emailStats || Object.values(emailStats).every((arr) => arr.length === 0)) {
    return <p>No data available</p>;
  }

  console.log("Email Stats:", emailStats); // Debugging output

  const chartData = Object.entries(emailStats).map(([status, docIds]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: docIds.length, // Use length to count the number of docs
    color: STATUS_COLORS[status] || "#607D8B",
  }));

  console.log("Chart Data:", chartData); // Debugging output

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}