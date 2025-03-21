import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
    failed: "#F44336", // Red
    delivered: "#4CAF50", // Green
    unknown: "#9E9E9E", // Grey
};

export default function EmailStatsPieChart({ isAdmin, userId }) {
    const [emailStats, setEmailStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const collectionPath = isAdmin ? "sentEmails" : `users/${userId}/sentEmails`;
        const statsPath = isAdmin ? "global" : `users/${userId}`;

        const statsRef = doc(db, "emailStats", statsPath);
        const sentEmailsRef = collection(db, collectionPath);

        async function fetchStats() {
            try {
                const statsSnap = await getDoc(statsRef);

                if (statsSnap.exists() && statsSnap.data().emailStats) {
                    setEmailStats(statsSnap.data().emailStats);
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
                let stats = { sent: 0, failed: 0, pending: 0, delivered: 0, unknown: 0, failedSent: 0 };

                emailDocs.forEach((email) => {
                    const status = email.data().status;
                    stats[status] = (stats[status] || 0) + 1;
                });

                await setDoc(statsRef, { emailStats: stats });

                setEmailStats(stats);
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

    const chartData = Object.entries(emailStats)
        .filter(([status]) => ["delivered", "failed", "unknown"].includes(status)) 
        .map(([status, count]) => ({
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
