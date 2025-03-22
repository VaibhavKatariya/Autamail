import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, get } from "firebase/database";
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
    async function fetchStats() {
      try {
        const statsRef = isAdmin ? ref(rtdb, "emailStats") : ref(rtdb, `emailStats/users/${userId}`);
        const statsSnap = await get(statsRef);

        if (statsSnap.exists()) {
          setEmailStats(statsSnap.val());
        } else {
          console.log("No email stats found.");
          setEmailStats({ delivered: 0, failed: 0, unknown: 0 });
        }
      } catch (error) {
        console.error("Error fetching email stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isAdmin, userId]);

  if (loading) return <p>Loading...</p>;
  if (!emailStats || Object.values(emailStats).every((count) => count === 0)) {
    return <p>No data available</p>;
  }

  const chartData = Object.entries(emailStats).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count.length,
    color: STATUS_COLORS[status] || "#607D8B",
  }));

  console.log(chartData)

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