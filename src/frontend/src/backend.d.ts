import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface CommunityPost {
    postType: string;
    userName: string;
    duration: string;
    subject: string;
    userId: string;
    createdAt: bigint;
    photoUrl: string;
    caption: string;
    sessionId: string;
    postId: string;
}
export interface Session {
    startTime: bigint;
    isCompleted: boolean;
    endTime: bigint;
    subjectName: string;
    distractionCount: bigint;
    elapsedSeconds: bigint;
    endPhoto: ExternalBlob;
    startPhoto: ExternalBlob;
}
export interface Squad {
    members: Array<Principal>;
    name: string;
}
export interface PostComment {
    userName: string;
    commentId: string;
    userId: string;
    createdAt: bigint;
    text: string;
    postId: string;
}
export interface Post {
    title: string;
    subjectName: string;
    body: string;
    author: Principal;
}
export interface Profile {
    displayName: string;
    badges: Array<string>;
    lastStudyDate: string;
    totalStudySeconds: bigint;
    longestStreak: bigint;
    deskItems: Array<string>;
    currentStreak: bigint;
}
export interface FeedEntry {
    startTime: bigint;
    isCompleted: boolean;
    endTime: bigint;
    subjectName: string;
    distractionCount: bigint;
    elapsedSeconds: bigint;
    endPhoto: ExternalBlob;
    startPhoto: ExternalBlob;
}
export interface SyllabusGoal {
    subjectName: string;
    userId: string;
    createdAt: bigint;
    totalLectures: bigint;
    completedLectures: bigint;
    examDate: bigint;
}
export interface SquadMessage {
    messageId: string;
    squadId: string;
    userId: string;
    userName: string;
    messageText: string;
    createdAt: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: string, text: string): Promise<PostComment>;
    addStudySession(studySession: FeedEntry): Promise<void>;
    addSyllabusGoal(syllabusGoal: SyllabusGoal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeSession(session: Session): Promise<void>;
    createCommunityPost(post: CommunityPost): Promise<void>;
    createPost(publishPost: Post): Promise<void>;
    createSquad(squad: Squad): Promise<void>;
    deleteComment(commentId: string): Promise<void>;
    deleteCommunityPost(postId: string): Promise<void>;
    getCallerSession(): Promise<Session | null>;
    getCallerSyllabusGoals(): Promise<Array<SyllabusGoal>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: string): Promise<Array<PostComment>>;
    getCommunityFeed(): Promise<Array<CommunityPost>>;
    getCommunityFeedWithAuth(): Promise<Array<CommunityPost>>;
    getFeed(): Promise<Array<FeedEntry>>;
    getPostLikeCount(postId: string): Promise<{
        count: bigint;
        liked: boolean;
    }>;
    getPosts(subjectName: string): Promise<Array<Post>>;
    getSquadMessages(squadId: string): Promise<Array<SquadMessage>>;
    getStreakLeaderboard(): Promise<Array<Profile>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getWeeklyLeaderboard(): Promise<Array<Profile>>;
    isCallerAdmin(): Promise<boolean>;
    joinSquad(squadName: string): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    sendSquadMessage(squadId: string, messageText: string): Promise<SquadMessage>;
    startSession(session: Session): Promise<void>;
    togglePostLike(postId: string): Promise<bigint>;
}
