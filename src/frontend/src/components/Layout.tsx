import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BookMarked,
  BookOpen,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Sofa,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Page } from "../App";
import type { UserProfile } from "../backend";

interface NavItem {
  id: Page;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "session", label: "Study Session", icon: <BookOpen size={16} /> },
  { id: "squad", label: "My Squad", icon: <Users size={16} /> },
  { id: "syllabus", label: "Syllabus Map", icon: <MapPin size={16} /> },
  { id: "community", label: "Community", icon: <MessageCircle size={16} /> },
  { id: "rooms", label: "Subject Rooms", icon: <BookMarked size={16} /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { id: "desk", label: "My Desk", icon: <Sofa size={16} /> },
];

interface Props {
  activePage: Page;
  onNavigate: (p: Page) => void;
  userProfile: UserProfile | null;
  children: ReactNode;
}

export default function Layout({
  activePage,
  onNavigate,
  userProfile,
  children,
}: Props) {
  const initials = userProfile?.displayName
    ? userProfile.displayName.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.951 0.02 75)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "oklch(0.907 0.025 75)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <button
            type="button"
            data-ocid="nav.dashboard.link"
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-black text-sm text-foreground leading-tight hidden sm:block">
              THE
              <br />
              FOCUS DEN
            </span>
          </button>

          {/* Nav */}
          <nav className="flex-1 overflow-x-auto">
            <ul className="flex items-center gap-1 min-w-max">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    data-ocid={`nav.${item.id}.link`}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activePage === item.id
                        ? "text-primary border-b-2 border-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* My Desk pill + Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              data-ocid="nav.desk.button"
              size="sm"
              variant="outline"
              onClick={() => onNavigate("desk")}
              className="rounded-full text-xs font-bold border-primary text-primary hidden lg:flex"
            >
              🏘️ My Desk
            </Button>
            <button
              type="button"
              data-ocid="nav.profile.link"
              onClick={() => onNavigate("profile")}
              className="rounded-full ring-2 ring-primary/30 hover:ring-primary transition-all"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer
        className="border-t border-border py-4 text-center text-xs text-muted-foreground"
        style={{ background: "oklch(0.907 0.025 75)" }}
      >
        <p>
          © {new Date().getFullYear()} The Focus Den · Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
