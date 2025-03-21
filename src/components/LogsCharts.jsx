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
  const [emailStats, setEmailStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionPath = isAdmin ? "sentEmails" : `users/${userId}/sentEmails`;
    const sentEmailsRef = collection(db, collectionPath);

    async function fetchStats() {
      try {
        const statsRef = ref(rtdb, "emailStats");
        const statsSnap = await get(statsRef);

        if (statsSnap.exists()) {
          const data = statsSnap.val();
          setEmailStats({
            delivered: data.delivered?.length || 0,
            failed: data.failed?.length || 0,
            unknown: data.unknown?.length || 0,
          });
          setLoading(false);
        } else {
          computeAndStoreStats();
        }
      } catch (error) {
        console.error("Error fetching email stats:", error);
        setLoading(false);
      }
    }

    async function computeAndStoreStats() {
      try {
        const emailDocs = await getDocs(sentEmailsRef);
        let stats = { delivered: [], failed: [], unknown: [] };

        emailDocs.forEach((email) => {
          const status = email.data().status;
          if (status in stats) {
            stats[status].push(email.id); // ✅ Store as array
          }
        });

        await set(ref(rtdb, "emailStats"), stats);
        setEmailStats({
          delivered: stats.delivered.length,
          failed: stats.failed.length,
          unknown: stats.unknown.length,
        });
      } catch (error) {
        console.error("Error computing email stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isAdmin, userId]);

  if (loading) return <p>Loading...</p>;
  if (!emailStats) return <p>No data available</p>;

  const chartData = Object.entries(emailStats).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || "#607D8B",
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        >
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
