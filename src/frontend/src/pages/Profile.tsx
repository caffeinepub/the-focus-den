import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Flame,
  Loader2,
  LogOut,
  Save,
  Trophy,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetCallerUserProfile, useSaveProfile } from "../hooks/useQueries";

interface Props {
  onLogout: () => void;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Profile({ onLogout }: Props) {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveProfile();
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveName = async () => {
    if (!editName.trim() || !profile) return;
    try {
      await saveProfile.mutateAsync({
        ...profile,
        displayName: editName.trim(),
      });
      toast.success("Name updated!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleEditStart = () => {
    setEditName(profile?.displayName ?? "");
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  const currentStreak = Number(profile?.currentStreak ?? 0);
  const longestStreak = Number(profile?.longestStreak ?? 0);
  const totalSeconds = Number(profile?.totalStudySeconds ?? 0);
  const badges = profile?.badges ?? [];
  const hasDeepWorkBadge =
    currentStreak >= 7 || badges.includes("Deep Work Master");

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-1">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your study identity and achievements.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-warm shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback
                  className="text-xl font-black"
                  style={{
                    background: "oklch(0.574 0.1 135 / 0.2)",
                    color: "oklch(0.574 0.1 135)",
                  }}
                >
                  {(profile?.displayName ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      data-ocid="profile.name.input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="rounded-xl h-9"
                      autoFocus
                    />
                    <Button
                      data-ocid="profile.save_name.save_button"
                      size="sm"
                      onClick={handleSaveName}
                      disabled={saveProfile.isPending}
                      className="rounded-full shrink-0"
                    >
                      {saveProfile.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                    </Button>
                    <Button
                      data-ocid="profile.cancel_name.cancel_button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="rounded-full shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-foreground truncate">
                      {profile?.displayName ?? "Student"}
                    </p>
                    <button
                      type="button"
                      data-ocid="profile.edit_name.edit_button"
                      onClick={handleEditStart}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      edit
                    </button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-0.5">
                  Last studied: {profile?.lastStudyDate ?? "Never"}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div
                className="p-3 rounded-xl"
                style={{ background: "oklch(0.92 0.02 75)" }}
              >
                <Flame size={18} className="mx-auto mb-1 text-primary" />
                <p className="text-xl font-black text-foreground">
                  {currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: "oklch(0.92 0.02 75)" }}
              >
                <Trophy size={18} className="mx-auto mb-1 text-primary" />
                <p className="text-xl font-black text-foreground">
                  {longestStreak}
                </p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
              <div
                className="p-3 rounded-xl"
                style={{ background: "oklch(0.92 0.02 75)" }}
              >
                <Clock size={18} className="mx-auto mb-1 text-primary" />
                <p className="text-xl font-black text-foreground">
                  {formatHours(totalSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">Total Study</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="card-warm shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy size={16} className="text-primary" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasDeepWorkBadge && badges.length === 0 ? (
              <div
                data-ocid="profile.badges.empty_state"
                className="text-center py-6 text-muted-foreground"
              >
                <p className="text-2xl mb-1">🏅</p>
                <p className="text-sm">
                  No badges yet. Keep studying to earn your first one!
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hasDeepWorkBadge && (
                  <Badge
                    data-ocid="profile.deep_work_badge.card"
                    style={{
                      background: "oklch(0.762 0.12 75)",
                      color: "oklch(0.22 0.04 55)",
                    }}
                    className="text-sm py-1 px-3"
                  >
                    🏆 Deep Work Master
                  </Badge>
                )}
                {badges.map((b, i) => (
                  <Badge
                    key={b}
                    data-ocid={`profile.badge.item.${i + 1}`}
                    variant="outline"
                    className="text-sm py-1 px-3"
                  >
                    {b}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          data-ocid="profile.logout.delete_button"
          variant="outline"
          onClick={onLogout}
          className="w-full rounded-full font-bold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
}
