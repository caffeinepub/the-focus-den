import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommunityPost,
  FeedEntry,
  Post,
  PostComment,
  Profile,
  Session,
  Squad,
  SyllabusGoal,
} from "../backend";
import { useActor } from "./useActor";

// SquadMessage type — defined locally until backend regeneration includes it
export interface SquadMessage {
  messageId: string;
  squadId: string;
  userId: string;
  userName: string;
  messageText: string;
  createdAt: bigint;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<Profile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerSession() {
  const { actor, isFetching } = useActor();
  return useQuery<Session | null>({
    queryKey: ["callerSession"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerSession();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<FeedEntry[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCommunityFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<CommunityPost[]>({
    queryKey: ["communityFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommunityFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCommunityPost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: CommunityPost) => {
      if (!actor) throw new Error("No actor");
      await actor.createCommunityPost(post);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityFeed"] }),
  });
}

export function useDeleteCommunityPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteCommunityPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityFeed"] });
    },
  });
}

export function useGetPostLikeCount(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{ count: bigint; liked: boolean }>({
    queryKey: ["postLikes", postId],
    queryFn: async () => {
      if (!actor) return { count: BigInt(0), liked: false };
      return actor.getPostLikeCount(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.togglePostLike(postId);
    },
    onSuccess: (_data, postId) => {
      qc.invalidateQueries({ queryKey: ["postLikes", postId] });
    },
  });
}

export function useGetComments(postId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PostComment[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComments(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addComment(postId, text);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
    }: { commentId: string; postId: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteComment(commentId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useGetWeeklyLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile[]>({
    queryKey: ["weeklyLeaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeeklyLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStreakLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile[]>({
    queryKey: ["streakLeaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStreakLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPosts(subjectName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["posts", subjectName],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts(subjectName);
    },
    enabled: !!actor && !isFetching && !!subjectName,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useStartSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: Session) => {
      if (!actor) throw new Error("No actor");
      await actor.startSession(session);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerSession"] }),
  });
}

export function useCompleteSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: Session) => {
      if (!actor) throw new Error("No actor");
      await actor.completeSession(session);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerSession"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetCallerSyllabusGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<SyllabusGoal[]>({
    queryKey: ["callerSyllabusGoals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerSyllabusGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSyllabusGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: SyllabusGoal) => {
      if (!actor) throw new Error("No actor");
      await actor.addSyllabusGoal(goal);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["callerSyllabusGoals"] }),
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Post) => {
      if (!actor) throw new Error("No actor");
      await actor.createPost(post);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["posts", vars.subjectName] }),
  });
}

export function useCreateSquad() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (squad: Squad) => {
      if (!actor) throw new Error("No actor");
      await actor.createSquad(squad);
    },
  });
}

export function useJoinSquad() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      await actor.joinSquad(name);
    },
  });
}

export function useGetSquadMessages(squadId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SquadMessage[]>({
    queryKey: ["squadMessages", squadId],
    queryFn: async () => {
      if (!actor || !squadId) return [];
      const a = actor as any;
      if (typeof a.getSquadMessages !== "function") return [];
      return a.getSquadMessages(squadId) as Promise<SquadMessage[]>;
    },
    enabled: !!actor && !isFetching && !!squadId,
    refetchInterval: 5000,
  });
}

export function useSendSquadMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      squadId,
      messageText,
    }: { squadId: string; messageText: string }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.sendSquadMessage !== "function") {
        throw new Error("Squad messaging not available yet");
      }
      return a.sendSquadMessage(squadId, messageText) as Promise<SquadMessage>;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["squadMessages", vars.squadId] });
    },
  });
}
