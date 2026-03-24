import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Square,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type {
  CommunityPost,
  StudySession as StudySessionType,
} from "../backend";
import { useCamera } from "../camera/useCamera";
import {
  useCompleteSession,
  useCreateCommunityPost,
  useGetCallerUserProfile,
  useSaveProfile,
  useStartSession,
} from "../hooks/useQueries";

type Phase = "setup" | "start-photo" | "active" | "end-photo" | "complete";

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function StudySession() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(true);
  const [startPhotoBlob, setStartPhotoBlob] = useState<ExternalBlob | null>(
    null,
  );
  const [startPhotoPreview, setStartPhotoPreview] = useState<string | null>(
    null,
  );
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<StudySessionType | null>(null);
  const [_endBlobRef, setEndBlobRef] = useState<ExternalBlob | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  // Capture elapsed/subject at completion time so community post uses correct values
  const finalElapsedRef = useRef<number>(0);
  const finalSubjectRef = useRef<string>("");
  const shareToCommunityRef = useRef<boolean>(true);
  const sessionStartedRef = useRef<boolean>(false);

  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const createCommunityPost = useCreateCommunityPost();
  const { data: profile } = useGetCallerUserProfile();
  const saveProfile = useSaveProfile();

  const camera = useCamera({ quality: 0.85 });

  // Keep shareToCommunityRef in sync
  useEffect(() => {
    shareToCommunityRef.current = shareToCommunity;
  }, [shareToCommunity]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(
        () => setElapsedSeconds((s) => s + 1),
        1000,
      );
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused]);

  // Visibility / distraction detection
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isRunning && !isPaused) {
      setDistractionCount((c) => c + 1);
      setIsPaused(true);
      toast.warning("Distraction logged! Switched to another tab.", {
        id: "distraction",
      });
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (phase !== "active") return;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase, handleVisibilityChange]);

  const handleStartCamera = async () => {
    setPhase("start-photo");
    await camera.startCamera();
  };

  const handleCaptureStart = async () => {
    // Guard: prevent duplicate session creation
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    setIsStarting(true);

    // Capture photo
    const file = await camera.capturePhoto();
    if (!file) {
      toast.error("Failed to capture photo");
      sessionStartedRef.current = false;
      setIsStarting(false);
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes);
    setStartPhotoBlob(blob);
    setStartPhotoPreview(URL.createObjectURL(file));
    await camera.stopCamera();

    console.log("[Session] Photo captured");

    // Build session object
    const now = BigInt(Date.now());
    const session: StudySessionType = {
      startTime: now,
      endTime: BigInt(0),
      subjectName: subject,
      distractionCount: BigInt(0),
      elapsedSeconds: BigInt(0),
      isCompleted: false,
      startPhoto: blob,
      endPhoto: ExternalBlob.fromBytes(new Uint8Array(0)),
    };

    // Immediately create session and start timer — do NOT wait for backend
    setSessionData(session);
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setPhase("active");

    console.log("[Session] Session created");
    console.log("[Session] Timer started");

    toast.success("Session started! Stay focused! 🌿");

    // Fire-and-forget: save to backend (non-blocking)
    startSession
      .mutateAsync(session)
      .then(() => console.log("[Session] Backend session saved"))
      .catch((err) =>
        console.error("[Session] Backend save failed (non-blocking):", err),
      );

    // Fire-and-forget: generate SHA-256 hash in background (non-blocking)
    crypto.subtle
      .digest("SHA-256", bytes)
      .then((buf) => {
        const hash = new Uint8Array(buf);
        console.log("[Session] Hash generated, length:", hash.length);
      })
      .catch((err) =>
        console.error("[Session] Hash generation failed (non-blocking):", err),
      );

    console.log("[Session] Photo uploaded (async)");
  };

  const handleEndSessionCamera = async () => {
    setIsRunning(false);
    setPhase("end-photo");
    await camera.startCamera();
  };

  const handleCaptureEnd = async () => {
    const file = await camera.capturePhoto();
    if (!file) {
      toast.error("Failed to capture photo");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const endBlob = ExternalBlob.fromBytes(bytes);
    setEndBlobRef(endBlob);
    setEndPhotoPreview(URL.createObjectURL(file));
    await camera.stopCamera();

    if (!sessionData || !startPhotoBlob) return;

    // Snapshot values at completion time
    finalElapsedRef.current = elapsedSeconds;
    finalSubjectRef.current = subject;

    const completed: StudySessionType = {
      ...sessionData,
      endTime: BigInt(Date.now()),
      elapsedSeconds: BigInt(elapsedSeconds),
      distractionCount: BigInt(distractionCount),
      isCompleted: true,
      endPhoto: endBlob,
      startPhoto: startPhotoBlob,
    };
    try {
      await completeSession.mutateAsync(completed);
      // Update profile total hours
      if (profile) {
        const newTotal = profile.totalStudySeconds + BigInt(elapsedSeconds);
        const newHours = Number(newTotal) / 3600;
        const deskItemNames = [
          "Cat",
          "Tea Cup",
          "Bookshelf",
          "Plant",
          "Window Light",
        ];
        const unlockedCount = Math.min(
          Math.floor(newHours / 10),
          deskItemNames.length,
        );
        const deskItems = deskItemNames.slice(0, unlockedCount);
        await saveProfile.mutateAsync({
          ...profile,
          totalStudySeconds: newTotal,
          lastStudyDate: new Date().toISOString().split("T")[0],
          deskItems,
        });
      }

      setPhase("complete");
      toast.success("Session complete! Great work! 🏆");

      // ✅ Create community post IMMEDIATELY after session is marked complete
      if (shareToCommunityRef.current) {
        try {
          const communityPost: CommunityPost = {
            postId: `session-${Date.now()}`,
            userId: profile?.displayName ?? "user",
            userName: profile?.displayName ?? "Student",
            postType: "session",
            duration: formatTime(finalElapsedRef.current),
            subject: finalSubjectRef.current,
            caption: "",
            photoUrl: endBlob.getDirectURL(),
            createdAt: BigInt(Date.now()),
            sessionId: `session-${startTimeRef.current}`,
          };
          console.log(
            "[Community] Creating post, duration:",
            communityPost.duration,
            "subject:",
            communityPost.subject,
          );
          await createCommunityPost.mutateAsync(communityPost);
          console.log("[Community] Community post created successfully");
          toast.success("Shared to community! 🔥");
        } catch (postErr) {
          // Silent fail — do not block session completion
          console.warn(
            "[Community] Post creation failed (non-blocking):",
            postErr,
          );
        }
      }
    } catch {
      toast.error("Failed to save session");
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setSubject("");
    setElapsedSeconds(0);
    setDistractionCount(0);
    setIsRunning(false);
    setIsPaused(false);
    setShareToCommunity(true);
    setStartPhotoBlob(null);
    setStartPhotoPreview(null);
    setEndPhotoPreview(null);
    setSessionData(null);
    setEndBlobRef(null);
    sessionStartedRef.current = false;
    setIsStarting(false);
  };

  // Reusable camera error overlay
  const CameraErrorOverlay = () => {
    if (!camera.error) return null;
    const isPermission = camera.error.type === "permission";
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center gap-3">
        <AlertTriangle size={32} className="mb-1" />
        <p className="text-sm font-semibold leading-snug">
          {isPermission
            ? "Please allow camera access in your browser settings and reload the page."
            : camera.error.message}
        </p>
        {isPermission ? (
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} className="mr-1" />
            Reload Page
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => camera.retry()}
          >
            Retry
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-6">
          Study Session
        </h1>

        <AnimatePresence mode="wait">
          {/* Phase: Setup */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle>What are you studying today?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label
                      htmlFor="session-subject"
                      className="text-sm font-semibold text-muted-foreground mb-1 block"
                    >
                      Subject
                    </label>
                    <Input
                      id="session-subject"
                      data-ocid="session.subject.input"
                      placeholder="e.g. SFM – Bond Valuation"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div
                    className="p-4 rounded-xl space-y-2"
                    style={{ background: "oklch(0.92 0.02 75)" }}
                  >
                    <p className="text-sm font-bold text-foreground">
                      📸 Session Proof Required
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll take a photo of your setup (laptop, notebook, pen)
                      to start, and a photo of your notes to complete the
                      session.
                    </p>
                  </div>
                  <Button
                    data-ocid="session.start_camera.primary_button"
                    onClick={handleStartCamera}
                    disabled={!subject.trim()}
                    className="w-full rounded-full font-bold h-12"
                  >
                    <Camera size={18} className="mr-2" />
                    Take Setup Photo to Begin
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Phase: Start Photo */}
          {phase === "start-photo" && (
            <motion.div
              key="start-photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera size={18} className="text-primary" />
                    Photo Proof: Your Study Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Take a photo of your desk setup (laptop, notebook, pen). No
                    gallery uploads!
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden bg-black relative"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <video
                      ref={camera.videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas ref={camera.canvasRef} className="hidden" />
                    {camera.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    <CameraErrorOverlay />
                  </div>
                  <Button
                    data-ocid="session.capture_start.primary_button"
                    onClick={handleCaptureStart}
                    disabled={
                      isStarting || !camera.isActive || camera.isLoading
                    }
                    className="w-full rounded-full font-bold h-12"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Starting session…
                      </>
                    ) : (
                      <>
                        <Camera size={18} className="mr-2" />
                        Capture &amp; Start Timer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Phase: Active */}
          {phase === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full pulse-green"
                      style={{ background: "oklch(0.574 0.1 135)" }}
                    />
                    Session Active – {subject}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timer */}
                  <div className="text-center">
                    <div
                      className={`w-48 h-48 rounded-full flex flex-col items-center justify-center mx-auto ${!isPaused ? "timer-active" : ""}`}
                      style={{
                        background: "oklch(0.97 0.015 78)",
                        border: `4px solid ${isPaused ? "oklch(0.48 0.19 27)" : "oklch(0.574 0.1 135)"}`,
                      }}
                    >
                      <p
                        className="font-black"
                        style={{
                          fontSize: 42,
                          color: isPaused
                            ? "oklch(0.48 0.19 27)"
                            : "oklch(0.22 0.04 55)",
                        }}
                      >
                        {formatTime(elapsedSeconds)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPaused ? "Paused" : "Elapsed"}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "oklch(0.92 0.02 75)" }}
                    >
                      <p className="text-2xl font-black text-foreground">
                        {distractionCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Distractions
                      </p>
                    </div>
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "oklch(0.92 0.02 75)" }}
                    >
                      <p className="text-2xl font-black text-foreground">
                        {subject.split(" ")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">Subject</p>
                    </div>
                  </div>

                  {isPaused && (
                    <div
                      data-ocid="session.distraction.error_state"
                      className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: "oklch(0.95 0.05 27)" }}
                    >
                      <AlertTriangle
                        size={16}
                        style={{ color: "oklch(0.48 0.19 27)" }}
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "oklch(0.48 0.19 27)" }}
                      >
                        Distraction logged – tap Resume to continue
                      </p>
                    </div>
                  )}

                  {/* Start photo preview */}
                  {startPhotoPreview && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "oklch(0.92 0.02 75)" }}
                    >
                      <img
                        src={startPhotoPreview}
                        alt="Setup"
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        ✅ Setup photo captured
                      </p>
                    </div>
                  )}

                  <Progress
                    value={((elapsedSeconds % 3600) / 3600) * 100}
                    className="h-2"
                  />

                  <div className="flex gap-3">
                    <Button
                      data-ocid="session.pause.toggle"
                      variant="outline"
                      className="flex-1 rounded-full"
                      onClick={() => setIsPaused((p) => !p)}
                    >
                      {isPaused ? (
                        <>
                          <Play size={16} className="mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause size={16} className="mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      data-ocid="session.end.primary_button"
                      className="flex-1 rounded-full font-bold"
                      onClick={handleEndSessionCamera}
                    >
                      <Square size={16} className="mr-2" />
                      End &amp; Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Phase: End Photo */}
          {phase === "end-photo" && (
            <motion.div
              key="end-photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-primary" />
                    Verify Session: Photo of Your Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Take a photo of your handwritten notes to complete the
                    session.
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden bg-black relative"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <video
                      ref={camera.videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas ref={camera.canvasRef} className="hidden" />
                    {camera.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    <CameraErrorOverlay />
                  </div>
                  <Button
                    data-ocid="session.capture_end.primary_button"
                    onClick={handleCaptureEnd}
                    disabled={
                      !camera.isActive ||
                      camera.isLoading ||
                      completeSession.isPending
                    }
                    className="w-full rounded-full font-bold h-12"
                  >
                    {completeSession.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Saving session…
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Complete Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Phase: Complete */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-warm shadow-warm">
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                  <div className="text-6xl">🏆</div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">
                      Session Complete!
                    </h2>
                    <p className="text-muted-foreground">{subject}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                    <div className="card-warm p-4 text-center">
                      <p className="text-3xl font-black text-primary">
                        {formatTime(elapsedSeconds)}
                      </p>
                      <p className="text-xs text-muted-foreground">Studied</p>
                    </div>
                    <div className="card-warm p-4 text-center">
                      <p
                        className="text-3xl font-black"
                        style={{
                          color:
                            distractionCount > 3
                              ? "oklch(0.48 0.19 27)"
                              : "oklch(0.574 0.1 135)",
                        }}
                      >
                        {distractionCount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Distractions
                      </p>
                    </div>
                  </div>
                  {endPhotoPreview && (
                    <img
                      src={endPhotoPreview}
                      alt="Notes"
                      className="w-full max-w-xs mx-auto rounded-2xl object-cover"
                      style={{ maxHeight: 200 }}
                    />
                  )}
                  <div className="flex gap-2 justify-center">
                    {profile?.badges?.includes("Deep Work Master") ||
                    Number(profile?.currentStreak ?? 0) >= 7 ? (
                      <Badge
                        style={{
                          background: "oklch(0.762 0.12 75)",
                          color: "oklch(0.22 0.04 55)",
                        }}
                      >
                        🏆 Deep Work Master
                      </Badge>
                    ) : null}
                  </div>

                  {/* Share to Community toggle */}
                  <div
                    className="flex items-center justify-between p-3 rounded-xl max-w-xs mx-auto"
                    style={{ background: "oklch(0.92 0.02 75)" }}
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        Share to Community
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Let others see your session 🔥
                      </p>
                    </div>
                    <Switch
                      data-ocid="session.share_community.switch"
                      checked={shareToCommunity}
                      onCheckedChange={setShareToCommunity}
                    />
                  </div>

                  <Button
                    data-ocid="session.new_session.primary_button"
                    onClick={handleReset}
                    className="rounded-full font-bold"
                  >
                    Start Another Session
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
