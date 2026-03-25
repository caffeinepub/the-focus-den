import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import {
  ChevronLeft,
  Loader2,
  LogIn,
  MessageCircle,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSquad,
  useGetSquadMessages,
  useJoinSquad,
  useSendSquadMessage,
} from "../hooks/useQueries";

type Squad = { id: string; name: string };

function loadMySquads(): Squad[] {
  try {
    return JSON.parse(localStorage.getItem("mySquads") || "[]");
  } catch {
    return [];
  }
}

function saveMySquads(squads: Squad[]) {
  localStorage.setItem("mySquads", JSON.stringify(squads));
}

export default function MySquad() {
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [mySquads, setMySquads] = useState<Squad[]>(loadMySquads);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);

  const createSquad = useCreateSquad();
  const joinSquad = useJoinSquad();
  const sendMessage = useSendSquadMessage();
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toText();

  const { data: messages = [], isLoading: messagesLoading } =
    useGetSquadMessages(selectedSquad?.id ?? "");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }); // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change

  const addSquad = (squad: Squad) => {
    setMySquads((prev) => {
      if (prev.find((s) => s.id === squad.id)) return prev;
      const next = [...prev, squad];
      saveMySquads(next);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!createName.trim() || !identity) return;
    try {
      await createSquad.mutateAsync({
        name: createName.trim(),
        members: [identity.getPrincipal() as unknown as Principal],
      });
      const squad = { id: createName.trim(), name: createName.trim() };
      addSquad(squad);
      toast.success(`Squad "${createName}" created!`);
      setSelectedSquad(squad);
      setCreateName("");
    } catch {
      toast.error("Failed to create squad");
    }
  };

  const handleJoin = async () => {
    if (!joinName.trim()) return;
    try {
      await joinSquad.mutateAsync(joinName.trim());
      const squad = { id: joinName.trim(), name: joinName.trim() };
      addSquad(squad);
      toast.success(`Joined squad "${joinName}"!`);
      setSelectedSquad(squad);
      setJoinName("");
    } catch {
      toast.error("Failed to join squad");
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedSquad) return;
    try {
      await sendMessage.mutateAsync({
        squadId: selectedSquad.id,
        messageText: messageText.trim(),
      });
      setMessageText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const formatTime = (createdAt: bigint) => {
    const ms = Number(createdAt) / 1_000_000;
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-foreground mb-1">My Squad</h1>
        <p className="text-muted-foreground text-sm">
          Study together. Stay accountable.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedSquad ? (
          /* ── Chat View ── */
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            <Card className="card-warm shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Button
                    data-ocid="chat.secondary_button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 shrink-0"
                    onClick={() => setSelectedSquad(null)}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircle
                      size={16}
                      className="text-primary shrink-0"
                    />
                    <CardTitle className="text-base truncate">
                      {selectedSquad.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Chat
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea
                  className="h-72 w-full rounded-xl border border-border px-3 py-2"
                  style={{ background: "oklch(0.975 0.014 78)" }}
                >
                  {messagesLoading ? (
                    <div
                      data-ocid="chat.loading_state"
                      className="flex items-center justify-center h-full py-8"
                    >
                      <Loader2
                        className="animate-spin text-muted-foreground"
                        size={20}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      data-ocid="chat.empty_state"
                      className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm"
                    >
                      No messages yet. Say hi! 👋
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 py-1">
                      {messages.map((msg, idx) => {
                        const isOwn = msg.userId === currentUserId;
                        return (
                          <div
                            key={msg.messageId}
                            data-ocid={`chat.item.${idx + 1}`}
                            className={`flex flex-col gap-0.5 max-w-[75%] ${
                              isOwn
                                ? "self-end items-end"
                                : "self-start items-start"
                            }`}
                          >
                            {!isOwn && (
                              <span className="text-xs font-bold text-primary px-1">
                                {msg.userName}
                              </span>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}
                            >
                              {msg.messageText}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    data-ocid="chat.input"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="rounded-xl flex-1"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    data-ocid="chat.primary_button"
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="rounded-xl shrink-0"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ── Squads List + Create/Join ── */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* Active Squads */}
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">
                Active Squads
              </h2>
              {mySquads.length === 0 ? (
                <div
                  data-ocid="squad.empty_state"
                  className="text-center py-12 text-muted-foreground rounded-2xl border border-border"
                  style={{ background: "oklch(0.969 0.018 78)" }}
                >
                  <p className="text-3xl mb-2">👥</p>
                  <p className="font-semibold text-foreground">
                    No squads yet.
                  </p>
                  <p className="text-sm mt-1">Create or join one below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mySquads.map((squad, idx) => (
                    <Card
                      key={squad.id}
                      data-ocid={`squad.item.${idx + 1}`}
                      className="card-warm shadow-warm"
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold text-primary-foreground shrink-0"
                            style={{ background: "oklch(0.65 0.18 50)" }}
                          >
                            {squad.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground truncate">
                            {squad.name}
                          </span>
                        </div>
                        <Button
                          data-ocid={`squad.open_modal_button.${idx + 1}`}
                          size="sm"
                          className="rounded-full shrink-0 ml-2"
                          onClick={() => setSelectedSquad(squad)}
                        >
                          💬 Open Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sloth Penalty */}
            <div
              className="p-4 rounded-2xl border border-border"
              style={{ background: "oklch(0.969 0.018 78)" }}
            >
              <p className="text-sm font-bold text-foreground mb-1">
                🦥 The Sloth Penalty
              </p>
              <p className="text-xs text-muted-foreground">
                Miss 2 consecutive study days? Your avatar turns into a Sloth
                until you complete a 3-hour session. Keep your streak to stay a
                focused scholar!
              </p>
            </div>

            {/* Create / Join */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus size={16} className="text-primary" />
                    Create a Squad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    data-ocid="squad.create.input"
                    placeholder="Squad name (e.g. SFM Ninjas)"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="rounded-xl"
                  />
                  <Button
                    data-ocid="squad.create.submit_button"
                    onClick={handleCreate}
                    disabled={!createName.trim() || createSquad.isPending}
                    className="w-full rounded-full font-bold"
                  >
                    {createSquad.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={14} />
                        Creating…
                      </>
                    ) : (
                      "Create Squad"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-warm shadow-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LogIn size={16} className="text-primary" />
                    Join a Squad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    data-ocid="squad.join.input"
                    placeholder="Enter squad name"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="rounded-xl"
                  />
                  <Button
                    data-ocid="squad.join.submit_button"
                    onClick={handleJoin}
                    disabled={!joinName.trim() || joinSquad.isPending}
                    className="w-full rounded-full font-bold"
                  >
                    {joinSquad.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={14} />
                        Joining…
                      </>
                    ) : (
                      "Join Squad"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
