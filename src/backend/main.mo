import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";


actor {
  let feedEntries = Map.empty<Principal, StudySession>();
  let squatrs = Map.empty<Text, Set.Set<Principal>>();
  let syllabusGoals = List.empty<SyllabusGoal>();
  let sessions = Map.empty<Principal, StudySession>();
  let posts = Map.empty<Principal, Post>();
  let communityPosts = List.empty<CommunityPost>();
  let profileOf = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Blob Storage
  include MixinStorage();

  // Types
  type Badge = Text;
  type DeskItem = Text;

  type UserProfile = {
    displayName : Text;
    totalStudySeconds : Nat;
    currentStreak : Nat;
    longestStreak : Nat;
    lastStudyDate : Text;
    badges : [Badge];
    deskItems : [DeskItem];
  };

  type StudySession = {
    subjectName : Text;
    startPhoto : Storage.ExternalBlob;
    endPhoto : Storage.ExternalBlob;
    startTime : Int;
    endTime : Int;
    elapsedSeconds : Nat;
    distractionCount : Nat;
    isCompleted : Bool;
  };

  type CommunityPost = {
    postId : Text;
    userId : Text;
    userName : Text;
    postType : Text;
    duration : Text;
    subject : Text;
    caption : Text;
    photoUrl : Text;
    createdAt : Int;
    sessionId : Text;
  };

  type SyllabusGoal = {
    subjectName : Text;
    totalLectures : Nat;
    completedLectures : Nat;
    examDate : Int;
  };

  type Post = {
    subjectName : Text;
    title : Text;
    body : Text;
    author : Principal;
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Nat.compare(b.totalStudySeconds, a.totalStudySeconds);
    };

    public func compareByStreak(a : UserProfile, b : UserProfile) : Order.Order {
      Nat.compare(b.currentStreak, a.currentStreak);
    };

    public func compareByDisplayName(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(b.displayName, a.displayName);
    };
  };

  module CommunityPost {
    public func compareByCreatedAt(a : CommunityPost, b : CommunityPost) : Order.Order {
      Int.compare(b.createdAt, a.createdAt); // Newest post first
    };
  };

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profileOf.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    profileOf.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileOf.get(user);
  };

  // Generate leaderboard based on total study hours
  public query func getWeeklyLeaderboard() : async [UserProfile] {
    profileOf.values().toArray().sort().values().take(10).toArray();
  };

  // Generate leaderboard based on current streak
  public query func getStreakLeaderboard() : async [UserProfile] {
    profileOf.values().toArray().sort(UserProfile.compareByStreak).values().take(10).toArray();
  };

  // Study Session Management
  public shared ({ caller }) func startSession(session : StudySession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sessions");
    };
    sessions.add(caller, session);
  };

  public shared ({ caller }) func completeSession(session : StudySession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete sessions");
    };
    sessions.add(caller, session);
  };

  // Get session for caller
  public query ({ caller }) func getCallerSession() : async ?StudySession {
    sessions.get(caller);
  };

  // Squad Management
  public type Squad = {
    name : Text;
    members : [Principal];
  };

  public shared ({ caller }) func createSquad(squad : Squad) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create squads");
    };
    let membersSet = Set.singleton(caller);
    squatrs.add(squad.name, membersSet);
  };

  public shared ({ caller }) func joinSquad(squadName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join squads");
    };
    switch (squatrs.get(squadName)) {
      case (?members) {
        if (members.size() >= 5) {
          Runtime.trap("Squad is full");
        };
        let updatedMembers = members.clone();
        updatedMembers.add(caller);
        squatrs.add(squadName, updatedMembers);
      };
      case (null) { Runtime.trap("Squad does not exist") };
    };
  };

  // Community Feed
  public shared ({ caller }) func addStudySession(studySession : StudySession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add study sessions");
    };
    feedEntries.add(caller, studySession);
  };

  // Syllabus Goals Management
  public shared ({ caller }) func addSyllabusGoal(syllabusGoal : SyllabusGoal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add syllabus goals");
    };
    syllabusGoals.add(syllabusGoal);
  };

  // Community Feed
  public query func getFeed() : async [StudySession] {
    feedEntries.values().toArray().filter(func(session) { session.isCompleted });
  };

  // get all posts by subject
  public query func getPosts(subjectName : Text) : async [Post] {
    posts.values().toArray().filter(func(post) { post.subjectName == subjectName });
  };

  public shared ({ caller }) func createPost(publishPost : Post) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    posts.add(caller, publishPost);
  };

  public shared ({ caller }) func createCommunityPost(post : CommunityPost) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create community posts");
    };
    // Check for duplicate sessionId if provided
    if (post.sessionId.size() > 0) {
      let alreadyExists = communityPosts.any(func(p) { p.sessionId == post.sessionId });
      if (alreadyExists) {
        return;
      };
    };

    // Prepend new post
    communityPosts.add(post);
    // Trim to max 50 posts (keep most recent first)
    let trimmed = List.empty<CommunityPost>();
    var count = 0;
    for (p in communityPosts.values()) {
      if (count < 50) {
        trimmed.add(p);
        count += 1;
      };
    };
    communityPosts.clear();
    for (p in trimmed.values()) {
      communityPosts.add(p);
    };
  };

  public query func getCommunityFeed() : async [CommunityPost] {
    let sorted = communityPosts.toArray().sort(CommunityPost.compareByCreatedAt);
    sorted.sliceToArray(0, Nat.min(50, sorted.size()));
  };
};
