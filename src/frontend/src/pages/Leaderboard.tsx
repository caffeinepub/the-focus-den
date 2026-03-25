import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Trophy } from "lucide-react";
import { motion } from "motion/react";
import type { Profile } from "../backend";
import {
  useGetStreakLeaderboard,
  useGetWeeklyLeaderboard,
} from "../hooks/useQueries";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

function LeaderboardList({
  users,
  valueKey,
}: { users: Profile[]; valueKey: "hours" | "streak" }) {
  if (users.length === 0) {
    return (
      <div
        data-ocid="leaderboard.empty_state"
        className="text-center py-16 text-muted-foreground"
      >
        <p className="text-3xl mb-2">🏆</p>
        <p className="font-semibold text-foreground">
          No study sessions recorded yet.
        </p>
        <p className="text-sm mt-1">Be the first on the board!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top 3 */}
      <div className="flex justify-center gap-4 py-4">
        {users.slice(0, 3).map((u, i) => (
          <motion.div
            key={u.displayName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex flex-col items-center gap-1 ${
              i === 0 ? "order-2 scale-110" : i === 1 ? "order-1" : "order-3"
            }`}
          >
            <span className="text-2xl">{RANK_EMOJIS[i]}</span>
            <Avatar
              className="w-12 h-12"
              style={{ border: `2px solid ${RANK_COLORS[i]}` }}
            >
              <AvatarFallback
                className="font-bold text-sm"
                style={{
                  background: `oklch(${0.7 + i * 0.05} 0.08 ${120 + i * 25})`,
                  color: "oklch(0.22 0.04 55)",
                }}
              >
                {u.displayName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-bold text-foreground text-center max-w-[80px] truncate">
              {u.displayName}
            </p>
            <p className="text-xs font-black" style={{ color: RANK_COLORS[i] }}>
              {valueKey === "hours"
                ? `${Math.round(Number(u.totalStudySeconds) / 3600)}h`
                : `${Number(u.currentStreak)}d`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {users.map((u, i) => (
          <motion.div
            key={u.displayName}
            data-ocid={`leaderboard.item.${i + 1}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background:
                i < 3 ? "oklch(0.969 0.018 78)" : "oklch(0.92 0.02 75)",
            }}
          >
            <span
              className="text-sm font-black w-6 text-center"
              style={{ color: i < 3 ? RANK_COLORS[i] : "oklch(0.44 0.04 55)" }}
            >
              {i + 1}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarFallback
                className="text-xs font-bold"
                style={{
                  background: `oklch(${0.7 + (i % 5) * 0.04} 0.08 ${120 + i * 15})`,
                  color: "oklch(0.22 0.04 55)",
                }}
              >
                {u.displayName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-semibold text-foreground truncate">
              {u.displayName}
            </span>
            {u.badges?.includes("Deep Work Master") && (
              <Badge
                className="text-xs"
                style={{
                  background: "oklch(0.762 0.12 75)",
                  color: "oklch(0.22 0.04 55)",
                }}
              >
                🏆
              </Badge>
            )}
            <span
              className="text-sm font-black"
              style={{ color: "oklch(0.574 0.1 135)" }}
            >
              {valueKey === "hours"
                ? `${Math.round(Number(u.totalStudySeconds) / 3600)}h`
                : `${Number(u.currentStreak)}d 🔥`}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: weeklyData = [], isLoading: wLoading } =
    useGetWeeklyLeaderboard();
  const { data: streakData = [], isLoading: sLoading } =
    useGetStreakLeaderboard();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-1">
          🏆 Hall of Fame
        </h1>
        <p className="text-sm text-muted-foreground">
          The most dedicated students this week.
        </p>
      </motion.div>

      <Tabs defaultValue="weekly">
        <TabsList className="rounded-full bg-secondary border border-border w-full">
          <TabsTrigger
            data-ocid="leaderboard.weekly.tab"
            value="weekly"
            className="rounded-full flex-1 gap-1"
          >
            <Trophy size={14} />
            Weekly Hours
          </TabsTrigger>
          <TabsTrigger
            data-ocid="leaderboard.streak.tab"
            value="streak"
            className="rounded-full flex-1 gap-1"
          >
            <Flame size={14} />
            Longest Streak
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card className="card-warm shadow-warm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Most Hours This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {wLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : (
                <LeaderboardList users={weeklyData} valueKey="hours" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card className="card-warm shadow-warm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Longest Study Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              {sLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : (
                <LeaderboardList users={streakData} valueKey="streak" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
