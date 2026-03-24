import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
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

  // --- New Types (keep old versions)
  type PostComment = {
    commentId : Text;
    postId : Text;
    userId : Text;
    userName : Text;
    text : Text;
    createdAt : Int;
  };

  type OldActor = {
    feedEntries : Map.Map<Principal, StudySession>;
    squatrs : Map.Map<Text, Set.Set<Principal>>;
    syllabusGoals : List.List<SyllabusGoal>;
    sessions : Map.Map<Principal, StudySession>;
    posts : Map.Map<Principal, Post>;
    communityPosts : List.List<CommunityPost>;
    profileOf : Map.Map<Principal, UserProfile>;
    postCreators : Map.Map<Text, Principal>;
  };

  public type NewActor = {
    feedEntries : Map.Map<Principal, StudySession>;
    squatrs : Map.Map<Text, Set.Set<Principal>>;
    syllabusGoals : List.List<SyllabusGoal>;
    sessions : Map.Map<Principal, StudySession>;
    posts : Map.Map<Principal, Post>;
    communityPosts : List.List<CommunityPost>;
    profileOf : Map.Map<Principal, UserProfile>;
    postCreators : Map.Map<Text, Principal>;
    postLikes : Map.Map<Text, Set.Set<Principal>>;
    postComments : List.List<PostComment>;
    commentCreators : Map.Map<Text, Principal>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      postLikes = Map.empty<Text, Set.Set<Principal>>();
      postComments = List.empty<PostComment>();
      commentCreators = Map.empty<Text, Principal>();
    };
  };
};
