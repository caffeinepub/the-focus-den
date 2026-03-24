import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sofa } from "lucide-react";
import { motion } from "motion/react";
import { useGetCallerUserProfile } from "../hooks/useQueries";

const DESK_ITEMS = [
  {
    name: "Cat",
    emoji: "🐱",
    unlockAt: 10,
    description: "A cozy tabby cat naps on your desk.",
  },
  {
    name: "Tea Cup",
    emoji: "☕",
    unlockAt: 20,
    description: "A steaming cup of green tea keeps you warm.",
  },
  {
    name: "Bookshelf",
    emoji: "📚",
    unlockAt: 30,
    description: "A sturdy oak bookshelf fills with knowledge.",
  },
  {
    name: "Plant",
    emoji: "🌿",
    unlockAt: 40,
    description: "A lush monstera plant brightens your den.",
  },
  {
    name: "Window Light",
    emoji: "🪟",
    unlockAt: 50,
    description: "Golden sunlight streams through your window.",
  },
];

export default function MyDesk() {
  const { data: profile } = useGetCallerUserProfile();
  const totalSeconds = Number(profile?.totalStudySeconds ?? 0);
  const totalHours = totalSeconds / 3600;
  const nextItem = DESK_ITEMS.find((item) => item.unlockAt > totalHours);
  const progressToNext = nextItem ? ((totalHours % 10) / 10) * 100 : 100;

  const unlockedItems = DESK_ITEMS.filter(
    (item) => item.unlockAt <= totalHours,
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-1">🏘️ My Desk</h1>
        <p className="text-sm text-muted-foreground">
          Your virtual study sanctuary. Unlock items every 10 hours.
        </p>
      </motion.div>

      {/* Desk Scene */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-warm shadow-warm overflow-hidden">
          <div
            className="relative h-64 flex items-end justify-center"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.87 0.06 75) 0%, oklch(0.762 0.09 75) 60%, oklch(0.575 0.07 55) 100%)",
            }}
          >
            {/* Window */}
            <div
              className="absolute top-4 right-8 w-24 h-32 rounded-t-xl border-4"
              style={{
                background: "oklch(0.95 0.08 90 / 0.7)",
                borderColor: "oklch(0.55 0.07 55)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-px h-full bg-current opacity-30"
                  style={{ color: "oklch(0.55 0.07 55)" }}
                />
                <div
                  className="h-px w-full bg-current opacity-30 absolute"
                  style={{ color: "oklch(0.55 0.07 55)" }}
                />
              </div>
            </div>

            {/* Desk surface */}
            <div
              className="absolute bottom-0 w-full h-20 rounded-t-3xl"
              style={{ background: "oklch(0.55 0.07 55)" }}
            />

            {/* Desk items */}
            <div className="relative z-10 flex items-end gap-4 pb-6 px-8">
              {DESK_ITEMS.map((item) => {
                const unlocked = item.unlockAt <= totalHours;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: unlocked ? 1 : 0.2,
                      scale: unlocked ? 1 : 0.8,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    title={
                      unlocked
                        ? item.description
                        : `Unlock at ${item.unlockAt}h`
                    }
                    className="text-center"
                  >
                    <span
                      className="text-4xl"
                      style={{ filter: unlocked ? "none" : "grayscale(100%)" }}
                    >
                      {item.emoji}
                    </span>
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{ color: unlocked ? "white" : "oklch(0.7 0 0)" }}
                    >
                      {item.name}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sofa size={16} className="text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">
                    {nextItem
                      ? `Next: ${nextItem.emoji} ${nextItem.name} at ${nextItem.unlockAt}h`
                      : "All items unlocked! 🎉"}
                  </span>
                  <span className="text-muted-foreground">
                    {totalHours.toFixed(1)}h / {nextItem?.unlockAt ?? 50}h
                  </span>
                </div>
                <Progress value={progressToNext} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Unlocked Items Grid */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">
          Unlocked Items ({unlockedItems.length}/{DESK_ITEMS.length})
        </h2>
        {unlockedItems.length === 0 ? (
          <div
            data-ocid="desk.items.empty_state"
            className="text-center py-12 text-muted-foreground card-warm rounded-2xl"
          >
            <p className="text-3xl mb-2">📚</p>
            <p className="font-semibold">Nothing unlocked yet</p>
            <p className="text-sm">
              Study for 10 hours to unlock your first item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {unlockedItems.map((item, i) => (
              <motion.div
                key={item.name}
                data-ocid={`desk.item.${i + 1}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="card-warm p-4 text-center shadow-warm"
              >
                <p className="text-4xl mb-2">{item.emoji}</p>
                <p className="font-bold text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
                <Badge
                  className="mt-2 text-xs"
                  style={{ background: "oklch(0.574 0.1 135)", color: "white" }}
                >
                  Unlocked at {item.unlockAt}h
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Locked items preview */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">
          Upcoming Unlocks
        </h2>
        <div className="space-y-2">
          {DESK_ITEMS.filter((item) => item.unlockAt > totalHours).map(
            (item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "oklch(0.92 0.02 75)", opacity: 0.7 }}
              >
                <span
                  className="text-2xl"
                  style={{ filter: "grayscale(100%)" }}
                >
                  {item.emoji}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  at {item.unlockAt}h
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
