import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";
import { type ReactElement, useState } from "react";
import type { Profile } from "./backend";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSaveProfile } from "./hooks/useQueries";
import CommunityFeed from "./pages/CommunityFeed";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import MyDesk from "./pages/MyDesk";
import MySquad from "./pages/MySquad";
import ProfilePage from "./pages/Profile";
import StudySession from "./pages/StudySession";
import SubjectRooms from "./pages/SubjectRooms";
import SyllabusMap from "./pages/SyllabusMap";

export type Page =
  | "dashboard"
  | "session"
  | "squad"
  | "syllabus"
  | "community"
  | "rooms"
  | "leaderboard"
  | "desk"
  | "profile";

export default function App() {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [setupName, setSetupName] = useState("");

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleSetupProfile = async () => {
    if (!setupName.trim()) return;
    const profile: Profile = {
      displayName: setupName.trim(),
      badges: [],
      lastStudyDate: new Date().toISOString().split("T")[0],
      totalStudySeconds: BigInt(0),
      longestStreak: BigInt(0),
      deskItems: [],
      currentStreak: BigInt(0),
    };
    await saveProfile.mutateAsync(profile);
  };

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">
            Loading The Focus Den…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.951 0.02 75) 0%, oklch(0.907 0.025 75) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-room.dim_1600x700.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 text-center space-y-8 px-6 max-w-md">
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-warm-lg">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-black text-foreground">
              The Focus Den
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Your cozy accountability studio for deep work. Track lectures,
              build streaks, and study with your squad.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              data-ocid="login.primary_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-bold rounded-full"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                "Sign In to Start Studying"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Secured by Internet Identity · No passwords needed
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { emoji: "📚", label: "Track Lectures" },
              { emoji: "🔥", label: "Build Streaks" },
              { emoji: "👥", label: "Study Squads" },
            ].map((f) => (
              <div key={f.label} className="card-warm p-3">
                <div className="text-2xl mb-1">{f.emoji}</div>
                <p className="text-xs font-semibold text-foreground">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          data-ocid="profile_setup.modal"
          className="card-warm p-8 max-w-sm w-full mx-6 space-y-6 shadow-warm-lg"
        >
          <div className="text-center space-y-2">
            <div className="text-4xl">🌿</div>
            <h2 className="text-2xl font-black">Welcome to The Focus Den!</h2>
            <p className="text-muted-foreground text-sm">
              Set your display name to get started.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              data-ocid="profile_setup.input"
              placeholder="Your name (e.g. Priya)"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetupProfile()}
              className="h-12 text-base rounded-xl border-border"
            />
            <Button
              data-ocid="profile_setup.submit_button"
              onClick={handleSetupProfile}
              disabled={!setupName.trim() || saveProfile.isPending}
              className="w-full h-12 font-bold rounded-full"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Setting up…
                </>
              ) : (
                "Enter the Den 🌿"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pages: Record<Page, ReactElement> = {
    dashboard: <Dashboard onNavigate={setActivePage} />,
    session: <StudySession />,
    squad: <MySquad />,
    syllabus: <SyllabusMap />,
    community: <CommunityFeed />,
    rooms: <SubjectRooms />,
    leaderboard: <Leaderboard />,
    desk: <MyDesk />,
    profile: <ProfilePage onLogout={handleLogout} />,
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <Layout
        activePage={activePage}
        onNavigate={setActivePage}
        userProfile={userProfile ?? null}
      >
        {pages[activePage]}
      </Layout>
    </>
  );
}
