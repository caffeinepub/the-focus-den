import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2, LogIn, Plus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateSquad, useJoinSquad } from "../hooks/useQueries";

export default function MySquad() {
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const createSquad = useCreateSquad();
  const joinSquad = useJoinSquad();
  const { identity } = useInternetIdentity();

  const handleCreate = async () => {
    if (!createName.trim() || !identity) return;
    try {
      await createSquad.mutateAsync({
        name: createName.trim(),
        members: [identity.getPrincipal() as unknown as Principal],
      });
      toast.success(`Squad "${createName}" created!`);
      setCreateName("");
    } catch {
      toast.error("Failed to create squad");
    }
  };

  const handleJoin = async () => {
    if (!joinName.trim()) return;
    try {
      await joinSquad.mutateAsync(joinName.trim());
      toast.success(`Joined squad "${joinName}"!`);
      setJoinName("");
    } catch {
      toast.error("Failed to join squad");
    }
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

      {/* Current Squads */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-base font-bold text-foreground mb-3">
          Active Squads
        </h2>
        <div
          data-ocid="squad.empty_state"
          className="text-center py-12 text-muted-foreground rounded-2xl border border-border"
          style={{ background: "oklch(0.969 0.018 78)" }}
        >
          <p className="text-3xl mb-2">👥</p>
          <p className="font-semibold text-foreground">No squads yet.</p>
          <p className="text-sm mt-1">Create or join one below.</p>
        </div>
      </motion.div>

      {/* Sloth Penalty Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="p-4 rounded-2xl border border-border"
          style={{ background: "oklch(0.969 0.018 78)" }}
        >
          <p className="text-sm font-bold text-foreground mb-1">
            🦥 The Sloth Penalty
          </p>
          <p className="text-xs text-muted-foreground">
            Miss 2 consecutive study days? Your avatar turns into a Sloth until
            you complete a 3-hour session. Keep your streak to stay a focused
            scholar!
          </p>
        </div>
      </motion.div>

      {/* Create / Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
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
        </motion.div>
      </div>
    </div>
  );
}
