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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { ArrowLeft, BookMarked, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreatePost, useGetPosts } from "../hooks/useQueries";

interface SubjectItem {
  name: string;
  code: string;
  emoji: string;
  color: string;
}

const PRESET_COLORS = [
  { label: "Green", value: "oklch(0.574 0.1 135)" },
  { label: "Amber", value: "oklch(0.762 0.12 75)" },
  { label: "Blue", value: "oklch(0.65 0.12 200)" },
  { label: "Brown", value: "oklch(0.475 0.07 55)" },
  { label: "Purple", value: "oklch(0.55 0.12 300)" },
  { label: "Red", value: "oklch(0.48 0.19 27)" },
];

function RoomView({
  subject,
  onBack,
}: { subject: SubjectItem; onBack: () => void }) {
  const { data: posts = [], isLoading } = useGetPosts(subject.name);
  const createPost = useCreatePost();
  const { identity } = useInternetIdentity();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim() || !identity) return;
    try {
      await createPost.mutateAsync({
        title: form.title,
        subjectName: subject.name,
        body: form.body,
        author: identity.getPrincipal() as unknown as Principal,
      });
      toast.success("Doubt posted!");
      setOpen(false);
      setForm({ title: "", body: "" });
    } catch {
      toast.error("Failed to post doubt");
    }
  };

  const displayPosts = posts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-ocid="rooms.back.link"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Rooms
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="rooms.post.primary_button"
              className="rounded-full font-bold"
            >
              <Plus size={14} className="mr-2" />
              Post a Doubt
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="rooms.post.dialog" className="card-warm">
            <DialogHeader>
              <DialogTitle>Post a Doubt in {subject.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                data-ocid="rooms.post_title.input"
                placeholder="Doubt title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="rounded-xl"
              />
              <Textarea
                data-ocid="rooms.post_body.textarea"
                placeholder="Describe your doubt in detail…"
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                className="rounded-xl min-h-[100px]"
              />
              <Button
                data-ocid="rooms.post.submit_button"
                onClick={handleSubmit}
                disabled={
                  !form.title.trim() ||
                  !form.body.trim() ||
                  createPost.isPending
                }
                className="w-full rounded-full font-bold"
              >
                {createPost.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={14} />
                    Posting…
                  </>
                ) : (
                  "Post Doubt"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-warm" style={{ borderColor: subject.color }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>{subject.emoji}</span>
            {subject.name}
            <Badge style={{ background: subject.color, color: "white" }}>
              {subject.code}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayPosts.length === 0 ? (
            <div
              data-ocid="rooms.doubts.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <p className="text-3xl mb-2">❓</p>
              <p className="font-semibold">No doubts yet</p>
              <p className="text-sm">Be the first to post a doubt!</p>
            </div>
          ) : (
            (
              displayPosts as {
                title: string;
                body: string;
                author: { toString(): string };
              }[]
            ).map((post, i) => (
              <Card
                key={post.title}
                data-ocid={`rooms.post.item.${i + 1}`}
                className="card-warm shadow-warm"
              >
                <CardContent className="pt-4">
                  <p className="font-bold text-foreground text-sm">
                    {post.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    —{" "}
                    {typeof post.author === "string"
                      ? post.author
                      : `${post.author.toString().slice(0, 10)}...`}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SubjectRooms() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selected, setSelected] = useState<SubjectItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    emoji: "📚",
    color: PRESET_COLORS[0].value,
  });

  const handleAddSubject = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSubjects((prev) => [
      ...prev,
      { ...form, name: form.name.trim(), code: form.code.trim() },
    ]);
    toast.success(`"${form.name}" room created!`);
    setAddOpen(false);
    setForm({ name: "", code: "", emoji: "📚", color: PRESET_COLORS[0].value });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">
            Subject Rooms
          </h1>
          <p className="text-sm text-muted-foreground">
            Post and discuss doubts from your recorded lectures.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="rooms.add.primary_button"
              className="rounded-full font-bold"
            >
              <Plus size={16} className="mr-2" />
              Add Subject Room
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="rooms.add.dialog" className="card-warm">
            <DialogHeader>
              <DialogTitle>New Subject Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                data-ocid="rooms.subject_name.input"
                placeholder="Subject name (e.g. Corporate Law)"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                data-ocid="rooms.subject_code.input"
                placeholder="Short code (e.g. LAW)"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                className="rounded-xl"
              />
              <Input
                data-ocid="rooms.subject_emoji.input"
                placeholder="Emoji (e.g. ⚖️)"
                value={form.emoji}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emoji: e.target.value }))
                }
                className="rounded-xl"
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Color
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: c.value,
                        borderColor:
                          form.color === c.value
                            ? "oklch(0.22 0.04 55)"
                            : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button
                data-ocid="rooms.add.submit_button"
                onClick={handleAddSubject}
                disabled={!form.name.trim() || !form.code.trim()}
                className="w-full rounded-full font-bold"
              >
                Create Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {selected ? (
        <RoomView subject={selected} onBack={() => setSelected(null)} />
      ) : subjects.length === 0 ? (
        <motion.div
          data-ocid="rooms.empty_state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <span className="text-5xl mb-4">📚</span>
          <h2 className="text-lg font-black text-foreground mb-1">
            No subject rooms yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a subject to get started.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((s, i) => (
            <motion.button
              key={s.name}
              data-ocid={`rooms.subject.item.${i + 1}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelected(s)}
              className="card-warm shadow-warm p-5 text-left rounded-2xl hover:shadow-warm-lg transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{s.emoji}</span>
                <Badge style={{ background: s.color, color: "white" }}>
                  {s.code}
                </Badge>
              </div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                {s.name}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <BookMarked size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  View Doubts →
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
