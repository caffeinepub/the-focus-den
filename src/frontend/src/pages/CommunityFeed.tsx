import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { StudySession } from "../backend";
import { useGetFeed } from "../hooks/useQueries";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CommunityFeed() {
  const { data: feedData = [], isLoading } = useGetFeed();
  const [reactions, setReactions] = useState<
    Record<string, { fire: number; validate: number }>
  >({});

  const toggleReaction = (key: string, type: "fire" | "validate") => {
    setReactions((prev) => ({
      ...prev,
      [key]: {
        fire: (prev[key]?.fire ?? 0) + (type === "fire" ? 1 : 0),
        validate: (prev[key]?.validate ?? 0) + (type === "validate" ? 1 : 0),
      },
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-1">
          Community Feed
        </h1>
        <p className="text-sm text-muted-foreground">
          Completed sessions from the community. Validate their hard work!
        </p>
      </motion.div>

      {isLoading ? (
        <div data-ocid="feed.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : feedData.length === 0 ? (
        <div
          data-ocid="feed.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-foreground">
            No sessions shared yet.
          </p>
          <p className="text-sm mt-1">Start studying to appear here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedData.map((item: StudySession, idx: number) => {
            const key = `item-${idx}`;
            const name = "Student";
            const subject = item.subjectName;
            const elapsed = Number(item.elapsedSeconds);
            const distractions = Number(item.distractionCount);
            const timeAgo = "Recently";
            const endPhotoUrl = item.endPhoto?.getDirectURL?.() ?? null;
            const r = reactions[key] ?? { fire: 0, validate: 0 };

            return (
              <motion.div
                key={key}
                data-ocid={`feed.item.${idx + 1}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="card-warm shadow-warm">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback
                          className="font-bold text-sm"
                          style={{
                            background: `oklch(${0.7 + (idx % 3) * 0.05} 0.08 ${120 + idx * 20})`,
                            color: "oklch(0.22 0.04 55)",
                          }}
                        >
                          {name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm">
                            {name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo}
                          </span>
                          {distractions === 0 && (
                            <Badge
                              className="text-xs"
                              style={{
                                background: "oklch(0.574 0.1 135)",
                                color: "white",
                              }}
                            >
                              🌟 Zero Distractions
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          📚 {subject}
                        </p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>⏱ {formatDuration(elapsed)}</span>
                          <span>😵 {distractions} distractions</span>
                        </div>
                      </div>
                    </div>

                    {endPhotoUrl && (
                      <img
                        src={endPhotoUrl}
                        alt="Notes"
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: 200 }}
                      />
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        data-ocid={`feed.item.${idx + 1}.toggle`}
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => toggleReaction(key, "validate")}
                      >
                        ✅ Validate {r.validate > 0 ? `(${r.validate})` : ""}
                      </Button>
                      <Button
                        data-ocid={`feed.item.${idx + 1}.secondary_button`}
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => toggleReaction(key, "fire")}
                      >
                        <Flame size={12} className="mr-1" />
                        Fire {r.fire > 0 ? `(${r.fire})` : ""}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
