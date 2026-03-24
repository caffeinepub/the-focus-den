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
export type Badge = string;
export interface Squad {
    members: Array<Principal>;
    name: string;
}
export interface Post {
    title: string;
    subjectName: string;
    body: string;
    author: Principal;
}
export interface StudySession {
    startTime: bigint;
    isCompleted: boolean;
    endTime: bigint;
    subjectName: string;
    distractionCount: bigint;
    elapsedSeconds: bigint;
    endPhoto: ExternalBlob;
    startPhoto: ExternalBlob;
}
export type DeskItem = string;
export interface UserProfile {
    displayName: string;
    badges: Array<Badge>;
    lastStudyDate: string;
    totalStudySeconds: bigint;
    longestStreak: bigint;
    deskItems: Array<DeskItem>;
    currentStreak: bigint;
}
export interface SyllabusGoal {
    subjectName: string;
    totalLectures: bigint;
    completedLectures: bigint;
    examDate: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudySession(studySession: StudySession): Promise<void>;
    addSyllabusGoal(syllabusGoal: SyllabusGoal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeSession(session: StudySession): Promise<void>;
    createCommunityPost(post: CommunityPost): Promise<void>;
    createPost(publishPost: Post): Promise<void>;
    createSquad(squad: Squad): Promise<void>;
    getCallerSession(): Promise<StudySession | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommunityFeed(): Promise<Array<CommunityPost>>;
    getFeed(): Promise<Array<StudySession>>;
    getPosts(subjectName: string): Promise<Array<Post>>;
    getStreakLeaderboard(): Promise<Array<UserProfile>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyLeaderboard(): Promise<Array<UserProfile>>;
    isCallerAdmin(): Promise<boolean>;
    joinSquad(squadName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSession(session: StudySession): Promise<void>;
}
