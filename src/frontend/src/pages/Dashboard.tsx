import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Flame, Play, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import type { Page } from "../App";
import {
  useGetCallerUserProfile,
  useGetFeed,
  useGetWeeklyLeaderboard,
} from "../hooks/useQueries";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  onNavigate: (p: Page) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { data: profile } = useGetCallerUserProfile();
  const { data: feed = [] } = useGetFeed();
  const { data: leaderboard = [] } = useGetWeeklyLeaderboard();

  const currentStreak = Number(profile?.currentStreak ?? 0);
  const totalSeconds = Number(profile?.totalStudySeconds ?? 0);
  const totalHours = totalSeconds / 3600;
  const nextUnlockAt = (Math.floor(totalHours / 10) + 1) * 10;
  const progressToNext = ((totalHours % 10) / 10) * 100;

  const displayFeed = feed.slice(0, 3);
  const displayLeaderboard = leaderboard.slice(0, 5);

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const today = now.getDate();
  const lastStudyDate = profile?.lastStudyDate;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ minHeight: 340 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-room.dim_1600x700.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        <div className="relative z-10 flex flex-col items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div
              className="w-52 h-52 rounded-full flex flex-col items-center justify-center mx-auto shadow-warm-lg"
              style={{
                background: "oklch(0.969 0.018 78 / 0.92)",
                border: "4px solid oklch(0.762 0.12 75)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Total Study Time
              </p>
              <p
                className="font-black text-foreground"
                style={{ fontSize: 40, lineHeight: 1.1 }}
              >
                {formatTime(totalSeconds)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                🔥 {currentStreak} day streak
              </p>
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <Button
                data-ocid="dashboard.start_session.primary_button"
                onClick={() => onNavigate("session")}
                className="rounded-full font-bold px-6 shadow-warm"
              >
                <Play size={16} className="mr-2" />
                Start Study Session
              </Button>
              <Button
                data-ocid="dashboard.syllabus.secondary_button"
                variant="outline"
                onClick={() => onNavigate("syllabus")}
                className="rounded-full font-bold px-6 bg-white/70 backdrop-blur border-border"
              >
                View Syllabus Map
              </Button>
            </div>
          </motion.div>
        </div>
        <div
          className="relative z-10 px-8 pb-4"
          style={{
            background: "oklch(0.907 0.025 75 / 0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              Next Desk Unlock: {Math.round(progressToNext)}%
            </span>
            <Progress value={progressToNext} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {nextUnlockAt}h
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Row 1: Streak + Squad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-warm shadow-warm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="text-primary" size={18} />
                  Current Streak: {currentStreak} Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const isToday = day === today;
                      const isPerfect =
                        lastStudyDate &&
                        new Date(lastStudyDate).getDate() === day &&
                        day <= today;
                      const isPast = day < today - currentStreak;
                      return (
                        <div
                          key={day}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                          style={{
                            background: isToday
                              ? "oklch(0.574 0.1 135)"
                              : isPerfect
                                ? "oklch(0.762 0.12 75)"
                                : isPast
                                  ? "oklch(0.92 0.02 75)"
                                  : "oklch(0.92 0.02 75)",
                            color: isToday ? "white" : "oklch(0.22 0.04 55)",
                          }}
                        >
                          {day}
                        </div>
                      );
                    },
                  )}
                </div>
                <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ background: "oklch(0.762 0.12 75)" }}
                    />
                    Perfect Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ background: "oklch(0.574 0.1 135)" }}
                    />
                    Today
                  </span>
                </div>
                {currentStreak >= 7 && (
                  <Badge
                    className="mt-2"
                    style={{
                      background: "oklch(0.762 0.12 75)",
                      color: "oklch(0.22 0.04 55)",
                    }}
                  >
                    🏆 Deep Work Master
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Squad Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-warm shadow-warm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="text-primary" size={18} />
                  Study Squad
                  <span className="ml-auto flex items-center gap-1 text-xs font-normal text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary pulse-green" />
                    Active now
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div
                  data-ocid="squad.empty_state"
                  className="text-center py-6 text-muted-foreground text-sm"
                >
                  Join a squad to see members here.
                </div>
                <Button
                  data-ocid="dashboard.squad.secondary_button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 rounded-full"
                  onClick={() => onNavigate("squad")}
                >
                  Manage Squad
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 2: Syllabus Progress Map Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-warm shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen size={18} className="text-primary" />
                Syllabus Progress Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                data-ocid="syllabus.preview.empty_state"
                className="text-center py-6 text-muted-foreground text-sm"
              >
                No subjects added yet. Go to Syllabus Map to add your subjects.
              </div>
              <Button
                data-ocid="dashboard.syllabus_map.secondary_button"
                variant="outline"
                size="sm"
                className="w-full mt-3 rounded-full"
                onClick={() => onNavigate("syllabus")}
              >
                Full Syllabus Map →
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 3: Feed + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Community Feed */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-warm shadow-warm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen size={18} className="text-primary" />
                  Community Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayFeed.length === 0 ? (
                  <div
                    data-ocid="feed.empty_state"
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    No sessions yet. Start studying!
                  </div>
                ) : (
                  displayFeed.map(
                    (item: { subjectName?: string }, idx: number) => {
                      const subject = item.subjectName ?? "Study Session";
                      return (
                        <div
                          key={`feed-${idx}-${subject}`}
                          data-ocid={`feed.item.${idx + 1}`}
                          className="flex gap-3 items-start"
                        >
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                              ST
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              Student
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              📚 {subject}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
                <Button
                  data-ocid="dashboard.community.secondary_button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => onNavigate("community")}
                >
                  View Full Feed →
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="card-warm shadow-warm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy size={18} className="text-primary" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayLeaderboard.length === 0 ? (
                  <div
                    data-ocid="leaderboard.empty_state"
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    No data yet. Be the first!
                  </div>
                ) : (
                  displayLeaderboard.map(
                    (
                      u: { displayName: string; totalStudySeconds: bigint },
                      i: number,
                    ) => (
                      <div
                        key={u.displayName}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="text-sm font-black w-5"
                          style={{
                            color:
                              i === 0
                                ? "#FFD700"
                                : i === 1
                                  ? "#C0C0C0"
                                  : i === 2
                                    ? "#CD7F32"
                                    : "oklch(0.44 0.04 55)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {u.displayName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold flex-1 truncate">
                          {u.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(Number(u.totalStudySeconds) / 3600)}h
                        </span>
                      </div>
                    ),
                  )
                )}
                <Button
                  data-ocid="dashboard.leaderboard.secondary_button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full mt-1"
                  onClick={() => onNavigate("leaderboard")}
                >
                  Full Leaderboard →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
