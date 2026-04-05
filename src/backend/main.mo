import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Blob "mo:core/Blob";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import OutCall "http-outcalls/outcall";

actor {
  /// Mixin component functionality
  include MixinStorage();

  /// User access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let idCounter = Map.empty<Principal, Nat>();
  let profileStore = Map.empty<Principal, AuraProfile>();
  let exerciseStore = Map.empty<Principal, List.List<Exercise>>();
  let habitsStore = Map.empty<Principal, List.List<HabitEntry>>();
  let habitLogStore = Map.empty<Principal, List.List<HabitLog>>();
  let photoStore = Map.empty<Principal, List.List<ProgressPhoto>>();
  let workoutLogStore = Map.empty<Principal, List.List<WorkoutSession>>();
  let aiChatStore = Map.empty<Principal, List.List<ChatMessage>>();
  let goalsStore = Map.empty<Principal, List.List<Goal>>();
  let journalStore = Map.empty<Principal, List.List<JournalEntry>>();
  let achievementStore = Map.empty<Principal, List.List<Achievement>>();
  let sessionStore = Map.empty<Principal, DermatSession>();

  type HabitEntryId = Nat;
  type DermatSession = {}; // Placeholder type

  module HabitEntryId {
    public func compare(id1 : HabitEntryId, id2 : HabitEntryId) : Order.Order {
      Nat.compare(id1, id2);
    };
  };

  /// Data models
  public type AuraProfile = {
    age : Nat;
    biologicalSex : Text;
    height : Float;
    weightHistory : [WeightEntry];
  };

  public type WeightEntry = {
    weight : Float;
    timestamp : Time.Time;
  };

  public type Exercise = {
    id : Nat;
    creator : Principal;
    name : Text;
    muscleGroup : Text;
    animationUrl : ?Text;
    youtubeUrl : ?Text;
  };

  public type WorkoutSession = {
    id : Nat;
    startTime : Time.Time;
    endTime : ?Time.Time;
    exercises : [WorkoutExercise];
    totalDuration : ?Int;
    activeTime : ?Int;
    restTime : ?Int;
  };

  public type WorkoutExercise = {
    id : Nat;
    exerciseId : Nat;
    name : Text;
    sets : [WorkoutSet];
  };

  public type WorkoutSet = {
    reps : Nat;
    weight : Float;
    notes : ?Text;
    timestamp : Time.Time;
    completed : Bool;
  };

  public type HabitType = { #build; #quit };
  public type GoalType = { #fitness; #habit };
  public type JournalEntry = {
    whatWentWell : Text;
    whatDidntGoWell : Text;
    whatToImprove : Text;
    timestamp : Time.Time;
  };

  public type Goal = {
    id : Nat;
    title : Text;
    goalType : GoalType;
    description : Text;
    targetValue : Float;
    unit : Text;
    currentValue : Float;
    deadline : ?Time.Time;
    completed : Bool;
  };

  public type HabitEntry = {
    id : Nat;
    name : Text;
    habitType : HabitType;
    description : ?Text;
    streakCount : Nat;
    completionRate : Float;
  };

  public type HabitLog = {
    habitId : HabitEntryId;
    date : Time.Time;
    status : Bool;
  };

  public type ProgressPhoto = {
    id : Nat;
    blobId : Text;
    timestamp : Time.Time;
    notes : ?Text;
  };

  public type ChatRole = { #user; #assistant };
  public type ChatMessage = {
    role : ChatRole;
    content : Text;
    timestamp : Time.Time;
  };

  public type Achievement = {
    id : Nat;
    name : Text;
    description : Text;
    dateEarned : Time.Time;
  };

  public type WeeklySummary = {
    habitCompletionRate : Float;
    numberOfWorkouts : Nat;
    weightChange : Float;
    totalActiveTime : Int;
  };

  /// Utility functions
  module Exercise {
    public func compare(ex1 : Exercise, ex2 : Exercise) : Order.Order {
      Nat.compare(ex1.id, ex2.id);
    };
    public func compareByName(ex1 : Exercise, ex2 : Exercise) : Order.Order {
      Text.compare(ex1.name, ex2.name);
    };
  };

  /// Authorization Helper Functions
  func assertUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func assertAdmin(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func isAdmin(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  func assertProfileOwnerOrAdmin(owner : Principal, caller : Principal) {
    if (not Principal.equal(caller, owner) and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only access your own profile");
    };
  };

  /// Core Functions

  /// Profile Management
  public shared ({ caller }) func saveProfile(profile : AuraProfile) : async () {
    assertUser(caller);
    profileStore.add(caller, profile);
  };

  public query ({ caller }) func getCallerProfile() : async ?AuraProfile {
    assertUser(caller);
    profileStore.get(caller);
  };

  public query ({ caller }) func getProfile(user : Principal) : async AuraProfile {
    assertProfileOwnerOrAdmin(user, caller);
    switch (profileStore.get(user)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("Profile does not exist") };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : AuraProfile) : async () {
    assertUser(caller);
    profileStore.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?AuraProfile {
    assertUser(caller);
    profileStore.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?AuraProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileStore.get(user);
  };

  /** Read all profiles (admin permission required). */
  public query ({ caller }) func readAllProfiles() : async {
    users : [Principal];
    profiles : [AuraProfile];
  } {
    assertAdmin(caller);
    let users = profileStore.keys().toArray();
    let profiles = profileStore.values().toArray();
    { users; profiles };
  };

  /// Exercise Management
  public shared ({ caller }) func createExercise(exercise : Exercise) : async Nat {
    assertUser(caller);

    let newId = getNextId(caller);
    let exerciseList = switch (exerciseStore.get(caller)) {
      case (null) { List.empty<Exercise>() };
      case (?existing) { existing };
    };

    exerciseList.add({
      exercise with
      id = newId;
      creator = caller;
    });

    exerciseStore.add(caller, exerciseList);
    newId;
  };

  public shared ({ caller }) func updateExercise(id : Nat, exercise : Exercise) : async () {
    assertUser(caller);

    let exercises = switch (exerciseStore.get(caller)) {
      case (null) { Runtime.trap("No exercises found") };
      case (?existing) { existing };
    };

    let newExercises = List.empty<Exercise>();
    var found = false;
    exercises.forEach(func(e) {
      if (e.id == id) {
        found := true;
        newExercises.add({
          exercise with
          id;
          creator = caller;
        });
      } else {
        newExercises.add(e);
      };
    });

    if (not found) { Runtime.trap("Exercise not found") };
    exerciseStore.add(caller, newExercises);
  };

  public shared ({ caller }) func deleteExercise(id : Nat) : async () {
    assertUser(caller);

    let exercises = switch (exerciseStore.get(caller)) {
      case (null) { Runtime.trap("No exercises found") };
      case (?existing) { existing };
    };

    let filtered = exercises.filter(
      func(e) { not (e.id == id) }
    );
    exerciseStore.add(caller, filtered);
  };

  public query ({ caller }) func getExercises() : async [Exercise] {
    assertUser(caller);

    switch (exerciseStore.get(caller)) {
      case (null) { [] };
      case (?existing) { existing.toArray().sort() };
    };
  };

  /// Habit Management
  public shared ({ caller }) func createHabit(habit : HabitEntry) : async Nat {
    assertUser(caller);

    let newId = getNextId(caller);
    let habitList = switch (habitsStore.get(caller)) {
      case (null) { List.empty<HabitEntry>() };
      case (?existing) { existing };
    };

    let newHabit = { habit with id = newId };
    habitList.add(newHabit);

    habitsStore.add(caller, habitList);
    newId;
  };

  public query ({ caller }) func getHabits() : async [HabitEntry] {
    assertUser(caller);

    switch (habitsStore.get(caller)) {
      case (null) { [] };
      case (?existing) { existing.toArray() };
    };
  };

  /// Weight Management
  public shared ({ caller }) func addWeightEntry(weight : Float) : async () {
    assertUser(caller);

    switch (profileStore.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let newWeightHistory = profile.weightHistory.concat([{
          weight;
          timestamp = Time.now();
        }]);
        profileStore.add(caller, { profile with weightHistory = newWeightHistory });
      };
    };
  };

  /// Media Management
  public shared ({ caller }) func addProgressPhoto(photo : ProgressPhoto) : async Nat {
    assertUser(caller);

    let newId = getNextId(caller);
    let photoList = switch (photoStore.get(caller)) {
      case (null) { List.empty<ProgressPhoto>() };
      case (?existing) { existing };
    };

    photoList.add({
      photo with
      id = newId;
      timestamp = Time.now();
    });

    photoStore.add(caller, photoList);
    newId;
  };

  public query ({ caller }) func getPhotos() : async [ProgressPhoto] {
    assertUser(caller);

    switch (photoStore.get(caller)) {
      case (null) { [] };
      case (?existing) { existing.toArray() };
    };
  };

  /// Journal Management
  public shared ({ caller }) func addJournalEntry(entry : JournalEntry) : async () {
    assertUser(caller);

    let journalList = switch (journalStore.get(caller)) {
      case (null) { List.empty<JournalEntry>() };
      case (?existing) { existing };
    };

    let newEntry = { entry with timestamp = Time.now() };
    journalList.add(newEntry);

    journalStore.add(caller, journalList);
  };

  public query ({ caller }) func getJournals() : async [JournalEntry] {
    assertUser(caller);

    switch (journalStore.get(caller)) {
      case (null) { [] };
      case (?existing) { existing.toArray() };
    };
  };

  /// Workout Management
  public shared ({ caller }) func addWorkoutSession(session : WorkoutSession) : async Nat {
    assertUser(caller);

    let newId = getNextId(caller);
    let workoutList = switch (workoutLogStore.get(caller)) {
      case (null) { List.empty<WorkoutSession>() };
      case (?existing) { existing };
    };

    let newSession = { session with id = newId };
    workoutList.add(newSession);

    workoutLogStore.add(caller, workoutList);
    newId;
  };

  public query ({ caller }) func getWorkouts() : async [WorkoutSession] {
    assertUser(caller);

    switch (workoutLogStore.get(caller)) {
      case (null) { [] };
      case (?existing) { existing.toArray() };
    };
  };

  /// Helper Functions
  func getNextId(caller : Principal) : Nat {
    let currentId = switch (idCounter.get(caller)) {
      case (null) { 0 };
      case (?id) { id };
    };
    idCounter.add(caller, currentId + 1);
    currentId;
  };

  /// HTTP Outcall Transform
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  /// BMR Calculation (simplified)
  public query ({ caller }) func calculateProfileStats() : async {
    bmr : Float;
    dailyCalories : Float;
    proteinTarget : Float;
    carbTarget : Float;
    fatTarget : Float;
  } {
    assertUser(caller);

    switch (profileStore.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let latestWeight = if (profile.weightHistory.size() > 0) {
          profile.weightHistory[profile.weightHistory.size() - 1].weight;
        } else {
          70.0;
        };

        let bmr = if (profile.biologicalSex == "male") {
          66.0 + (13.7 * latestWeight) + (5.0 * profile.height) - (6.8 * Int.fromNat(profile.age).toFloat());
        } else {
          655.0 + (9.6 * latestWeight) + (1.8 * profile.height) - (4.7 * Int.fromNat(profile.age).toFloat());
        };

        let dailyCalories = bmr * 1.5;
        {
          bmr;
          dailyCalories;
          proteinTarget = latestWeight * 2.2;
          carbTarget = dailyCalories * 0.5 / 4.0;
          fatTarget = dailyCalories * 0.25 / 9.0;
        };
      };
    };
  };
};
