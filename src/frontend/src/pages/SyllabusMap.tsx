import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Plus, Target } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddSyllabusGoal,
  useGetCallerSyllabusGoals,
} from "../hooks/useQueries";

interface LocalGoal {
  subjectName: string;
  totalLectures: number;
  completedLectures: number;
  examDate: string;
}

function calcGhostPace(goal: LocalGoal): {
  targetByNow: number;
  isBehind: boolean;
} {
  const examMs = new Date(goal.examDate).getTime();
  const nowMs = Date.now();
  const daysLeft = Math.max(0, (examMs - nowMs) / 86400000);
  const totalDays = 90;
  const elapsedDays = totalDays - daysLeft;
  const targetByNow = Math.round(
    (goal.totalLectures / totalDays) * elapsedDays,
  );
  const isBehind = goal.completedLectures < targetByNow;
  return { targetByNow, isBehind };
}

export default function SyllabusMap() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subjectName: "",
    totalLectures: "",
    completedLectures: "0",
    examDate: "",
  });

  const addGoal = useAddSyllabusGoal();
  const { data: backendGoals = [], isLoading } = useGetCallerSyllabusGoals();

  // Map backend SyllabusGoal (bigint fields) → LocalGoal for display
  const goals: LocalGoal[] = backendGoals.map((g) => ({
    subjectName: g.subjectName,
    totalLectures: Number(g.totalLectures),
    completedLectures: Number(g.completedLectures),
    examDate: new Date(Number(g.examDate)).toISOString().slice(0, 10),
  }));

  const handleAdd = async () => {
    const total = Number(form.totalLectures);
    const completed = Number(form.completedLectures);

    if (!form.subjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }
    if (!total || total <= 0) {
      toast.error("Total lectures must be greater than 0");
      return;
    }
    if (completed > total) {
      toast.error("Completed lectures cannot exceed total lectures");
      return;
    }

    try {
      await addGoal.mutateAsync({
        subjectName: form.subjectName.trim(),
        totalLectures: BigInt(total),
        completedLectures: BigInt(completed),
        examDate: BigInt(new Date(form.examDate).getTime()),
        userId: "",
        createdAt: BigInt(0),
      });
      toast.success(`Goal for "${form.subjectName.trim()}" saved!`);
      setOpen(false);
      setForm({
        subjectName: "",
        totalLectures: "",
        completedLectures: "0",
        examDate: "",
      });
    } catch {
      toast.error("Failed to save goal");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">
            Syllabus Map
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your lecture progress. Don't let the ghost outpace you.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="syllabus.add.primary_button"
              className="rounded-full font-bold"
            >
              <Plus size={16} className="mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="syllabus.add.dialog" className="card-warm">
            <DialogHeader>
              <DialogTitle>New Syllabus Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Subject Name */}
              <div className="space-y-1.5">
                <Label htmlFor="syllabus-subject">Subject Name</Label>
                <Input
                  id="syllabus-subject"
                  data-ocid="syllabus.subject.input"
                  type="text"
                  placeholder="Enter subject name"
                  value={form.subjectName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subjectName: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              {/* Total Lectures */}
              <div className="space-y-1.5">
                <Label htmlFor="syllabus-total">Total Lectures / Topics</Label>
                <Input
                  id="syllabus-total"
                  data-ocid="syllabus.total_lectures.input"
                  type="number"
                  placeholder="Enter total lectures"
                  min="1"
                  value={form.totalLectures}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalLectures: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              {/* Completed Lectures */}
              <div className="space-y-1.5">
                <Label htmlFor="syllabus-completed">
                  Completed Lectures / Topics
                </Label>
                <Input
                  id="syllabus-completed"
                  data-ocid="syllabus.completed_lectures.input"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.completedLectures}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      completedLectures: e.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
              </div>

              {/* Exam Date */}
              <div className="space-y-1.5">
                <Label htmlFor="syllabus-exam">Exam Date</Label>
                <Input
                  id="syllabus-exam"
                  data-ocid="syllabus.exam_date.input"
                  type="date"
                  value={form.examDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, examDate: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              <Button
                data-ocid="syllabus.save.submit_button"
                onClick={handleAdd}
                disabled={addGoal.isPending}
                className="w-full rounded-full font-bold"
              >
                {addGoal.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={14} />
                    Saving…
                  </>
                ) : (
                  "Save Goal"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div
          data-ocid="syllabus.loading_state"
          className="flex items-center justify-center py-16"
        >
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {/* Goals list or empty state */}
      {!isLoading && goals.length === 0 && (
        <motion.div
          data-ocid="syllabus.empty_state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <span className="text-5xl mb-4">🎯</span>
          <h2 className="text-lg font-black text-foreground mb-1">
            No subjects yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Add your first syllabus goal to start tracking.
          </p>
        </motion.div>
      )}

      {!isLoading && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal, idx) => {
            const { targetByNow, isBehind } = calcGhostPace(goal);
            const pct = Math.round(
              (goal.completedLectures / goal.totalLectures) * 100,
            );
            const ghostPct = Math.round(
              (targetByNow / goal.totalLectures) * 100,
            );
            const daysLeft = Math.max(
              0,
              Math.round(
                (new Date(goal.examDate).getTime() - Date.now()) / 86400000,
              ),
            );
            return (
              <motion.div
                key={`${goal.subjectName}-${idx}`}
                data-ocid={`syllabus.item.${idx + 1}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
              >
                <Card
                  className="card-warm shadow-warm"
                  style={
                    isBehind ? { borderColor: "oklch(0.48 0.19 27 / 0.5)" } : {}
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      <Target size={16} className="text-primary shrink-0" />
                      <span className="flex-1 truncate">
                        {goal.subjectName}
                      </span>
                      {isBehind && (
                        <Badge
                          data-ocid={`syllabus.item.${idx + 1}.error_state`}
                          className="text-xs shrink-0"
                          style={{
                            background: "oklch(0.48 0.19 27)",
                            color: "white",
                          }}
                        >
                          <AlertTriangle size={12} className="mr-1" />
                          Behind Pace
                        </Badge>
                      )}
                      <span className="text-xs font-normal text-muted-foreground">
                        {daysLeft}d to exam
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Progress: {goal.completedLectures}/
                          {goal.totalLectures} lectures
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="relative h-4 rounded-full overflow-hidden"
                        style={{ background: "oklch(0.92 0.02 75)" }}
                      >
                        <div
                          className="absolute top-0 h-full rounded-full opacity-30"
                          style={{
                            width: `${Math.min(ghostPct, 100)}%`,
                            background: isBehind
                              ? "oklch(0.48 0.19 27)"
                              : "oklch(0.762 0.12 75)",
                          }}
                        />
                        <div
                          className="absolute top-0 h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: isBehind
                              ? "oklch(0.48 0.19 27)"
                              : "oklch(0.574 0.1 135)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span
                          style={{
                            color: isBehind
                              ? "oklch(0.48 0.19 27)"
                              : "oklch(0.574 0.1 135)",
                          }}
                        >
                          👻 Ghost pace: {targetByNow} lectures
                        </span>
                        <span>Target: {ghostPct}%</span>
                      </div>
                    </div>

                    {isBehind && (
                      <div
                        className="p-2 rounded-lg text-xs font-semibold"
                        style={{
                          background: "oklch(0.95 0.05 27)",
                          color: "oklch(0.48 0.19 27)",
                        }}
                      >
                        ⚠️ You're behind schedule! Complete{" "}
                        {targetByNow - goal.completedLectures} more lectures to
                        catch up.
                      </div>
                    )}
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
