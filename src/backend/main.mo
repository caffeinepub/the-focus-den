import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Text "mo:core/Text";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";


// Use with clause to apply migration during upgrade

actor {
  type FeedEntry = {
    subjectName : Text;
    startPhoto : Storage.ExternalBlob;
    endPhoto : Storage.ExternalBlob;
    startTime : Int;
    endTime : Int;
    elapsedSeconds : Nat;
    distractionCount : Nat;
    isCompleted : Bool;
  };

  type Squad = {
    name : Text;
    members : [Principal];
  };

  type Session = {
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
    userId : Text;
    createdAt : Int;
  };

  type Post = {
    subjectName : Text;
    title : Text;
    body : Text;
    author : Principal;
  };

  type Profile = {
    displayName : Text;
    totalStudySeconds : Nat;
    currentStreak : Nat;
    longestStreak : Nat;
    lastStudyDate : Text;
    badges : [Text];
    deskItems : [Text];
  };

  type PostComment = {
    commentId : Text;
    postId : Text;
    userId : Text;
    userName : Text;
    text : Text;
    createdAt : Int;
  };

  type SquadMessage = {
    messageId : Text;
    squadId : Text;
    userId : Text;
    userName : Text;
    messageText : Text;
    createdAt : Int;
  };

  type FeedEntries = Map.Map<Principal, FeedEntry>;
  type Squatrs = Map.Map<Text, Set.Set<Principal>>;
  type SyllabusGoals = List.List<SyllabusGoal>;
  type Sessions = Map.Map<Principal, Session>;
  type Posts = Map.Map<Principal, Post>;
  type CommunityPosts = List.List<CommunityPost>;
  type ProfileOf = Map.Map<Principal, Profile>;
  type PostCreators = Map.Map<Text, Principal>;
  type PostLikes = Map.Map<Text, Set.Set<Principal>>;
  type PostComments = List.List<PostComment>;
  type CommentCreators = Map.Map<Text, Principal>;
  type SquadMessages = List.List<SquadMessage>;

  module UserProfile {
    public func compare(a : Profile, b : Profile) : Order.Order {
      Nat.compare(b.totalStudySeconds, a.totalStudySeconds);
    };

    public func compareByStreak(a : Profile, b : Profile) : Order.Order {
      Nat.compare(b.currentStreak, a.currentStreak);
    };

    public func compareByDisplayName(a : Profile, b : Profile) : Order.Order {
      Text.compare(b.displayName, a.displayName);
    };
  };

  module SyllabusGoal {
    public func compareByCreatedAt(a : SyllabusGoal, b : SyllabusGoal) : Order.Order {
      Int.compare(b.createdAt, a.createdAt); // Newest post first
    };
  };

  module CommunityPost {
    public func compareByCreatedAt(a : CommunityPost, b : CommunityPost) : Order.Order {
      Int.compare(b.createdAt, a.createdAt); // Newest post first
    };
  };

  module PostComment {
    public func compareByCreatedAt(a : PostComment, b : PostComment) : Order.Order {
      Int.compare(a.createdAt, b.createdAt); // Oldest comment first
    };
  };

  module SquadMessage {
    public func compareByCreatedAt(a : SquadMessage, b : SquadMessage) : Order.Order {
      Int.compare(a.createdAt, b.createdAt); // Oldest message first (ASC)
    };
  };

  // Persistent state variables are members of
  // a persistent actor class
  let feedEntries : FeedEntries = Map.empty<Principal, FeedEntry>();
  let squatrs : Squatrs = Map.empty<Text, Set.Set<Principal>>();
  let syllabusGoals : SyllabusGoals = List.empty<SyllabusGoal>();
  let sessions : Sessions = Map.empty<Principal, Session>();
  let posts : Posts = Map.empty<Principal, Post>();
  let communityPosts : CommunityPosts = List.empty<CommunityPost>();
  let profileOf : ProfileOf = Map.empty<Principal, Profile>();
  let postCreators : PostCreators = Map.empty<Text, Principal>(); // Track post creators for delete functionality
  let postLikes : PostLikes = Map.empty<Text, Set.Set<Principal>>(); // Likes for each post
  let postComments : PostComments = List.empty<PostComment>(); // List of all comments
  let commentCreators : CommentCreators = Map.empty<Text, Principal>(); // Track comment creators for delete functionality
  let squadMessages : SquadMessages = List.empty<SquadMessage>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Blob Storage
  include MixinStorage();

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profileOf.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    profileOf.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileOf.get(user);
  };

  // Generate leaderboard based on total study hours
  public query func getWeeklyLeaderboard() : async [Profile] {
    profileOf.values().toArray().sort().values().take(10).toArray();
  };

  // Generate leaderboard based on current streak
  public query func getStreakLeaderboard() : async [Profile] {
    profileOf.values().toArray().sort(UserProfile.compareByStreak).values().take(10).toArray();
  };

  // Study Session Management
  public shared ({ caller }) func startSession(session : Session) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sessions");
    };
    sessions.add(caller, session);
  };

  public shared ({ caller }) func completeSession(session : Session) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete sessions");
    };
    sessions.add(caller, session);
  };

  // Get session for caller
  public query ({ caller }) func getCallerSession() : async ?Session {
    sessions.get(caller);
  };

  // Squad Management
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

  // Squad Chat
  public shared ({ caller }) func sendSquadMessage(squadId : Text, messageText : Text) : async SquadMessage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let trimmed = messageText.trim(#char ' ');
    if (trimmed.size() == 0) {
      Runtime.trap("Message cannot be empty");
    };
    let time = Time.now();
    let messageId = squadId.concat(caller.toText().concat(time.toText()));
    let userName = switch (profileOf.get(caller)) {
      case (?profile) { profile.displayName };
      case (null) { "Anonymous" };
    };
    let msg : SquadMessage = {
      messageId;
      squadId;
      userId = caller.toText();
      userName;
      messageText = trimmed;
      createdAt = time;
    };
    squadMessages.add(msg);
    msg;
  };

  public query func getSquadMessages(squadId : Text) : async [SquadMessage] {
    let filtered = squadMessages.filter(func(m) { m.squadId == squadId });
    filtered.toArray().sort(SquadMessage.compareByCreatedAt);
  };

  // Community Feed
  public shared ({ caller }) func addStudySession(studySession : FeedEntry) : async () {
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
    let goal : SyllabusGoal = {
      syllabusGoal with
      userId = caller.toText();
      createdAt = Time.now();
    };
    syllabusGoals.add(goal);
  };

  // New endpoint to get user's own syllabus goals
  public query ({ caller }) func getCallerSyllabusGoals() : async [SyllabusGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view syllabus goals");
    };
    syllabusGoals.toArray().filter(func(goal) { goal.userId == caller.toText() }).sort(SyllabusGoal.compareByCreatedAt);
  };

  // Community Feed
  public query func getFeed() : async [FeedEntry] {
    feedEntries.values().toArray().filter(func(session) { session.isCompleted });
  };

  // get all posts by subject
  public query ({ caller }) func getPosts(subjectName : Text) : async [Post] {
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
    let trimAndAddPost = func() {
      let swappedArray = communityPosts.toArray();
      let trimmedArray = swappedArray.sliceToArray(0, Nat.min(49, swappedArray.size()));
      let trimmedList = List.empty<CommunityPost>();
      trimmedList.addAll(trimmedArray.values());
      trimmedList.add(post);
      communityPosts.clear();
      communityPosts.addAll(trimmedList.toArray().values());
    };
    let sortAndAddPost = func() {
      let sortedArray = communityPosts.toArray().sort(CommunityPost.compareByCreatedAt);
      let trimmedSortedArray = sortedArray.sliceToArray(0, Nat.min(49, sortedArray.size()));
      let trimmedList = List.empty<CommunityPost>();
      trimmedList.addAll(trimmedSortedArray.values());
      trimmedList.add(post);
      communityPosts.clear();
      communityPosts.addAll(trimmedList.toArray().values());
    };
    let addPost = func() {
      if (communityPosts.size() >= 50) { trimAndAddPost() } else {
        communityPosts.add(post);
      };
    };
    addPost();
    // Store creator in tracking map
    postCreators.add(post.postId, caller);
  };

  public shared ({ caller }) func deleteCommunityPost(postId : Text) : async () {
    // First check that caller is a registered user
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete community posts");
    };

    // Then check ownership
    switch (postCreators.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?creator) {
        if (creator != caller) {
          Runtime.trap("Unauthorized");
        } else {
          let filteredPosts = communityPosts.filter(func(p) { p.postId != postId });
          communityPosts.clear();
          for (p in filteredPosts.values()) {
            communityPosts.add(p);
          };
          postCreators.remove(postId); // Remove tracking
        };
      };
    };
  };

  public query func getCommunityFeed() : async [CommunityPost] {
    let sorted = communityPosts.toArray().sort(CommunityPost.compareByCreatedAt);
    sorted.sliceToArray(0, Nat.min(50, sorted.size()));
  };

  public query ({ caller }) func getCommunityFeedWithAuth() : async [CommunityPost] {
    let sorted = communityPosts.toArray().sort(CommunityPost.compareByCreatedAt);
    sorted.sliceToArray(0, Nat.min(50, sorted.size()));
  };

  // Likes
  public shared ({ caller }) func togglePostLike(postId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (postLikes.get(postId)) {
      case (null) {
        let newSet = Set.singleton(caller);
        postLikes.add(postId, newSet);
        1;
      };
      case (?existingLikes) {
        if (existingLikes.contains(caller)) {
          let updatedLikes = existingLikes.clone();
          updatedLikes.remove(caller);
          postLikes.add(postId, updatedLikes);
          updatedLikes.size();
        } else {
          let updatedLikes = existingLikes.clone();
          updatedLikes.add(caller);
          postLikes.add(postId, updatedLikes);
          updatedLikes.size();
        };
      };
    };
  };

  public query ({ caller }) func getPostLikeCount(postId : Text) : async {
    count : Nat;
    liked : Bool;
  } {
    switch (postLikes.get(postId)) {
      case (null) {
        { count = 0; liked = false };
      };
      case (?likes) {
        { count = likes.size(); liked = likes.contains(caller) };
      };
    };
  };

  // Comments
  public shared ({ caller }) func addComment(postId : Text, text : Text) : async PostComment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    // Check post existence
    if (not postCreators.containsKey(postId)) {
      Runtime.trap("Post does not exist");
    };
    // Check comment length
    let commentText = text.trim(#char ' ');
    if (commentText.size() == 0) {
      Runtime.trap("Comment cannot be empty");
    };
    if (commentText.size() > 500) {
      Runtime.trap("Comment must be less than 500 characters");
    };
    let time = Time.now();
    let commentId = postId.concat(caller.toText().concat(time.toText()));
    // Get user profile
    let userName = switch (profileOf.get(caller)) {
      case (?profile) { profile.displayName };
      // fallback
      case (null) { "Anonymous" };
    };
    let comment : PostComment = {
      commentId;
      postId;
      userId = caller.toText();
      userName;
      text = commentText;
      createdAt = time;
    };
    postComments.add(comment);
    // Track comment creator for delete rights
    commentCreators.add(commentId, caller);
    comment;
  };

  public query ({ caller }) func getComments(postId : Text) : async [PostComment] {
    let filtered = postComments.filter(
      func(c) {
        c.postId == postId
      }
    );
    filtered.toArray().sort(PostComment.compareByCreatedAt);
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };
    switch (commentCreators.get(commentId)) {
      case (null) {
        Runtime.trap("Comment not found");
      };
      case (?creator) {
        if (creator != caller) {
          Runtime.trap("Unauthorized: Only comment owner can delete comment");
        } else {
          let filteredComments = postComments.filter(func(c) { c.commentId != commentId });
          postComments.clear();
          for (c in filteredComments.values()) {
            postComments.add(c);
          };
          commentCreators.remove(commentId); // Remove tracking
        };
      };
    };
  };
};
