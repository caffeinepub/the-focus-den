import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { CommunityPost } from "../backend";
import {
  useCreateCommunityPost,
  useGetCallerUserProfile,
  useGetCommunityFeed,
} from "../hooks/useQueries";

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

function CreatePostModal() {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useGetCallerUserProfile();
  const createCommunityPost = useCreateCommunityPost();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const prev = URL.createObjectURL(file);
    setImagePreview(prev);
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error("Please upload a photo first");
      return;
    }
    if (caption.length > 200) {
      toast.error("Caption must be 200 characters or less");
      return;
    }
    setSubmitting(true);
    try {
      const compressed = await compressImage(imageFile);
      const blob = ExternalBlob.fromBytes(
        compressed as Uint8Array<ArrayBuffer>,
      );
      const photoUrl = blob.getDirectURL();
      const post: CommunityPost = {
        postId: `aesthetic-${Date.now()}`,
        userId: profile?.displayName ?? "user",
        userName: profile?.displayName ?? "Student",
        postType: "aesthetic",
        duration: "",
        subject: "",
        caption,
        photoUrl,
        createdAt: BigInt(Date.now()),
        sessionId: "",
      };
      await createCommunityPost.mutateAsync(post);
      toast.success("Shared to community! ✨");
      setOpen(false);
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(
        `Failed to post: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="feed.create_post.open_modal_button"
          className="rounded-full font-bold gap-2"
          size="sm"
        >
          <Plus size={16} />
          Post to Community
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="feed.create_post.dialog"
        className="max-w-md rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle>Share Your Study Vibe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Image Upload */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Upload Photo
            </p>
            <label
              data-ocid="feed.create_post.dropzone"
              htmlFor="community-post-image"
              className="block border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors"
              style={{ borderColor: "oklch(0.8 0.04 75)" }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full object-cover rounded-2xl"
                  style={{ maxHeight: 200 }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-2"
                  style={{ background: "oklch(0.96 0.015 75)" }}
                >
                  <p className="text-2xl">📷</p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload your desk or notes
                  </p>
                </div>
              )}
            </label>
            <input
              id="community-post-image"
              ref={fileInputRef}
              data-ocid="feed.create_post.upload_button"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">Caption</p>
              <span className="text-xs text-muted-foreground">
                {caption.length}/200
              </span>
            </div>
            <Textarea
              data-ocid="feed.create_post.textarea"
              placeholder="Show your study vibe ✨"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              data-ocid="feed.create_post.cancel_button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              data-ocid="feed.create_post.submit_button"
              className="flex-1 rounded-full font-bold"
              onClick={handleSubmit}
              disabled={submitting || !imageFile}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Sharing…
                </>
              ) : (
                "Share Post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityFeed() {
  const { data: feedData = [], isLoading } = useGetCommunityFeed();
  const [reactions, setReactions] = useState<
    Record<string, { fire: number; validate: number }>
  >({});

  // Sort by createdAt descending
  const sortedFeed = [...feedData].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

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
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">
            Community Feed
          </h1>
          <p className="text-sm text-muted-foreground">
            Study sessions and setups from the community. Keep each other
            accountable!
          </p>
        </div>
        <CreatePostModal />
      </motion.div>

      {isLoading ? (
        <div data-ocid="feed.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : sortedFeed.length === 0 ? (
        <div
          data-ocid="feed.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-foreground">No posts yet.</p>
          <p className="text-sm mt-1">
            Complete a session or share your setup to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFeed.map((post: CommunityPost, idx: number) => {
            const key = `item-${idx}`;
            const isSession = post.postType === "session";
            const r = reactions[key] ?? { fire: 0, validate: 0 };
            const initials = (post.userName || "S").slice(0, 2).toUpperCase();
            const avatarHue = 60 + (initials.charCodeAt(0) % 8) * 20;

            return (
              <motion.div
                key={post.postId || key}
                data-ocid={`feed.item.${idx + 1}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="card-warm shadow-warm rounded-2xl overflow-hidden">
                  <CardContent className="pt-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback
                          className="font-bold text-sm"
                          style={{
                            background: `oklch(0.82 0.1 ${avatarHue})`,
                            color: "oklch(0.22 0.04 55)",
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm">
                            {post.userName}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(Number(post.createdAt))}
                          </span>
                          <span className="text-base">
                            {isSession ? "📚" : "✨"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {isSession
                            ? `${post.userName} completed a ${post.duration} study session 🔥`
                            : `${post.userName} shared their study setup ✨`}
                        </p>
                        {isSession && post.subject && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            📖 {post.subject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Photo */}
                    {post.photoUrl && (
                      <img
                        src={post.photoUrl}
                        alt={isSession ? "Session notes" : "Study setup"}
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: 240 }}
                      />
                    )}

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-sm text-foreground leading-relaxed">
                        {post.caption}
                      </p>
                    )}

                    {/* Reaction buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        data-ocid={`feed.item.${idx + 1}.toggle`}
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => toggleReaction(key, "validate")}
                      >
                        ✅ Validate{r.validate > 0 ? ` (${r.validate})` : ""}
                      </Button>
                      <Button
                        data-ocid={`feed.item.${idx + 1}.secondary_button`}
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => toggleReaction(key, "fire")}
                      >
                        <Flame size={12} className="mr-1" />
                        Fire{r.fire > 0 ? ` (${r.fire})` : ""}
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
