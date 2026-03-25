import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Loader2,
  MessageCircle,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { CommunityPost, PostComment } from "../backend";
import {
  useAddComment,
  useCreateCommunityPost,
  useDeleteComment,
  useDeleteCommunityPost,
  useGetCallerUserProfile,
  useGetComments,
  useGetCommunityFeed,
  useGetPostLikeCount,
  useToggleLike,
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

function bytesToDataURL(bytes: Uint8Array, mimeType = "image/jpeg"): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
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
      const photoUrl = bytesToDataURL(compressed as Uint8Array);
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

// Full-screen lightbox
function ImageLightbox({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        data-ocid="feed.lightbox.modal"
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.85)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button
          type="button"
          data-ocid="feed.lightbox.close_button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-white"
          style={{ background: "rgba(0,0,0,0.5)" }}
          aria-label="Close image"
        >
          <X size={22} />
        </button>
        <motion.img
          src={url}
          alt="Full view"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Like button component
function LikeButton({ postId }: { postId: string }) {
  const { data, isLoading } = useGetPostLikeCount(postId);
  const toggleLike = useToggleLike();

  const liked = data?.liked ?? false;
  const count = Number(data?.count ?? 0);

  return (
    <button
      type="button"
      data-ocid="feed.post.toggle"
      disabled={isLoading || toggleLike.isPending}
      onClick={() => toggleLike.mutate(postId)}
      className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-all duration-150 select-none"
      style={{
        background: liked ? "oklch(0.95 0.06 15)" : "oklch(0.96 0.01 75)",
        color: liked ? "oklch(0.5 0.2 15)" : "oklch(0.5 0.04 75)",
        border: liked
          ? "1.5px solid oklch(0.85 0.1 15)"
          : "1.5px solid oklch(0.88 0.03 75)",
      }}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        size={13}
        className={liked ? "fill-current" : ""}
        style={{ transition: "transform 0.15s" }}
      />
      <span>{count > 0 ? count : "Like"}</span>
    </button>
  );
}

// Comments section component
function CommentsSection({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<
    string | null
  >(null);

  const { data: comments = [], isLoading } = useGetComments(
    expanded ? postId : "",
  );
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const handleSend = async () => {
    const text = commentText.trim();
    if (!text) return;
    try {
      await addComment.mutateAsync({ postId, text });
      setCommentText("");
    } catch {
      toast.error("Couldn't post comment");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteTargetCommentId) return;
    try {
      await deleteComment.mutateAsync({
        commentId: deleteTargetCommentId,
        postId,
      });
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeleteTargetCommentId(null);
    }
  };

  const commentCount = expanded ? comments.length : 0;

  return (
    <div>
      {/* Delete comment confirmation */}
      <AlertDialog
        open={!!deleteTargetCommentId}
        onOpenChange={(open) => !open && setDeleteTargetCommentId(null)}
      >
        <AlertDialogContent data-ocid="feed.delete_comment.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="feed.delete_comment.cancel_button"
              onClick={() => setDeleteTargetCommentId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="feed.delete_comment.confirm_button"
              onClick={handleConfirmDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComment.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Trash2 size={14} className="mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle button */}
      <button
        type="button"
        data-ocid="feed.post.secondary_button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-all duration-150 select-none"
        style={{
          background: expanded ? "oklch(0.93 0.04 240)" : "oklch(0.96 0.01 75)",
          color: expanded ? "oklch(0.42 0.12 240)" : "oklch(0.5 0.04 75)",
          border: expanded
            ? "1.5px solid oklch(0.82 0.09 240)"
            : "1.5px solid oklch(0.88 0.03 75)",
        }}
      >
        <MessageCircle size={13} />
        <span>
          {expanded
            ? commentCount > 0
              ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
              : "Comments"
            : "Comment"}
        </span>
      </button>

      {/* Expanded comments */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 rounded-xl space-y-3 p-3"
              style={{ background: "oklch(0.97 0.01 75)" }}
            >
              <Separator className="opacity-40" />

              {/* Comment list */}
              {isLoading ? (
                <div
                  data-ocid="feed.comments.loading_state"
                  className="space-y-2"
                >
                  <Skeleton className="h-8 rounded-lg" />
                  <Skeleton className="h-8 rounded-lg" />
                </div>
              ) : comments.length === 0 ? (
                <p
                  data-ocid="feed.comments.empty_state"
                  className="text-xs text-center py-2"
                  style={{ color: "oklch(0.62 0.04 75)" }}
                >
                  No comments yet. Be the first! 💬
                </p>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment: PostComment, ci: number) => {
                    const cInitials = (comment.userName || "S")
                      .slice(0, 2)
                      .toUpperCase();
                    const cHue = 60 + (cInitials.charCodeAt(0) % 8) * 20;
                    const isOwner =
                      !!currentUserId && comment.userId === currentUserId;

                    return (
                      <div
                        key={comment.commentId}
                        data-ocid={`feed.comments.item.${ci + 1}`}
                        className="flex items-start gap-2"
                      >
                        <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                          <AvatarFallback
                            className="text-[9px] font-bold"
                            style={{
                              background: `oklch(0.88 0.07 ${cHue})`,
                              color: "oklch(0.3 0.04 55)",
                            }}
                          >
                            {cInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span
                              className="text-xs font-bold"
                              style={{ color: "oklch(0.35 0.06 55)" }}
                            >
                              {comment.userName}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "oklch(0.62 0.03 75)" }}
                            >
                              {timeAgo(Number(comment.createdAt))}
                            </span>
                          </div>
                          <p
                            className="text-xs leading-relaxed mt-0.5"
                            style={{ color: "oklch(0.38 0.04 55)" }}
                          >
                            {comment.text}
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            type="button"
                            data-ocid={`feed.comments.delete_button.${ci + 1}`}
                            onClick={() =>
                              setDeleteTargetCommentId(comment.commentId)
                            }
                            className="shrink-0 p-1 rounded opacity-40 hover:opacity-80 transition-opacity"
                            style={{ color: "oklch(0.5 0.15 15)" }}
                            aria-label="Delete comment"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add comment input */}
              <div className="flex gap-2 items-center pt-1">
                <Input
                  data-ocid="feed.comments.input"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={300}
                  className="rounded-full text-xs h-8 flex-1"
                  style={{ background: "oklch(1 0 0)" }}
                />
                <Button
                  data-ocid="feed.comments.submit_button"
                  size="icon"
                  disabled={!commentText.trim() || addComment.isPending}
                  onClick={handleSend}
                  className="h-8 w-8 rounded-full shrink-0"
                  aria-label="Send comment"
                >
                  {addComment.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CommunityFeed() {
  const { data: feedData = [], isLoading } = useGetCommunityFeed();
  const { data: profile } = useGetCallerUserProfile();
  const deletePost = useDeleteCommunityPost();

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const currentUserId = profile?.displayName ?? null;

  // Sort by createdAt descending
  const sortedFeed = [...feedData].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deletePost.mutateAsync(deleteTargetId);
      toast.success("Post deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Lightbox */}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent data-ocid="feed.delete_post.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="feed.delete_post.cancel_button"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="feed.delete_post.confirm_button"
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Trash2 size={14} className="mr-2" />
              )}
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            const initials = (post.userName || "S").slice(0, 2).toUpperCase();
            const avatarHue = 60 + (initials.charCodeAt(0) % 8) * 20;
            const isOwner =
              !!profile?.displayName && post.userId === profile.displayName;

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
                            ? (() => {
                                const distractionMatch =
                                  post.caption?.match(/Distractions:/);
                                const distractionInfo = distractionMatch
                                  ? ` (${post.caption!.replace("Distractions: ", "").split(",").length} distractions)`
                                  : "";
                                return `${post.userName} completed a ${post.duration} study session 🔥${distractionInfo}`;
                              })()
                            : `${post.userName} shared their study setup ✨`}
                        </p>
                        {isSession && post.subject && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            📖 {post.subject}
                          </p>
                        )}
                      </div>

                      {/* 3-dot menu — owner only */}
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              data-ocid={`feed.item.${idx + 1}.open_modal_button`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                              aria-label="Post options"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            data-ocid={`feed.item.${idx + 1}.dropdown_menu`}
                            align="end"
                          >
                            <DropdownMenuItem
                              data-ocid={`feed.item.${idx + 1}.delete_button`}
                              className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                              onClick={() => setDeleteTargetId(post.postId)}
                            >
                              <Trash2 size={14} />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Photo — clickable for lightbox */}
                    {post.photoUrl && (
                      <button
                        type="button"
                        data-ocid={`feed.item.${idx + 1}.canvas_target`}
                        className="w-full p-0 border-0 bg-transparent cursor-pointer rounded-xl overflow-hidden block"
                        onClick={() => setLightboxUrl(post.photoUrl)}
                        aria-label="View full image"
                      >
                        <img
                          src={post.photoUrl}
                          alt={isSession ? "Session notes" : "Study setup"}
                          className="w-full rounded-xl object-cover transition-opacity hover:opacity-90 active:opacity-75"
                          style={{ maxHeight: 240 }}
                        />
                      </button>
                    )}

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-sm text-foreground leading-relaxed">
                        {post.caption}
                      </p>
                    )}

                    {/* Actions row: Like + Comment */}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <LikeButton postId={post.postId} />
                      <CommentsSection
                        postId={post.postId}
                        currentUserId={currentUserId}
                      />
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
