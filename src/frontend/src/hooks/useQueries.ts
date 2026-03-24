import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommunityPost,
  Post,
  PostComment,
  Squad,
  StudySession,
  SyllabusGoal,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
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
  return useQuery<StudySession | null>({
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
  return useQuery<StudySession[]>({
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
  return useQuery<UserProfile[]>({
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
  return useQuery<UserProfile[]>({
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
    mutationFn: async (profile: UserProfile) => {
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
    mutationFn: async (session: StudySession) => {
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
    mutationFn: async (session: StudySession) => {
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

export function useAddSyllabusGoal() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (goal: SyllabusGoal) => {
      if (!actor) throw new Error("No actor");
      await actor.addSyllabusGoal(goal);
    },
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
