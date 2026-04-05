import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Exercise {
    id: bigint;
    creator: Principal;
    name: string;
    animationUrl?: string;
    muscleGroup: string;
    youtubeUrl?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface WorkoutSession {
    id: bigint;
    startTime: Time;
    endTime?: Time;
    totalDuration?: bigint;
    exercises: Array<WorkoutExercise>;
    restTime?: bigint;
    activeTime?: bigint;
}
export interface HabitEntry {
    id: bigint;
    completionRate: number;
    habitType: HabitType;
    name: string;
    description?: string;
    streakCount: bigint;
}
export interface AuraProfile {
    age: bigint;
    height: number;
    weightHistory: Array<WeightEntry>;
    biologicalSex: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface WorkoutSet {
    weight: number;
    reps: bigint;
    completed: boolean;
    notes?: string;
    timestamp: Time;
}
export interface JournalEntry {
    whatDidntGoWell: string;
    whatWentWell: string;
    whatToImprove: string;
    timestamp: Time;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ProgressPhoto {
    id: bigint;
    notes?: string;
    timestamp: Time;
    blobId: string;
}
export interface WeightEntry {
    weight: number;
    timestamp: Time;
}
export interface WorkoutExercise {
    id: bigint;
    exerciseId: bigint;
    name: string;
    sets: Array<WorkoutSet>;
}
export enum HabitType {
    quit = "quit",
    build = "build"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Journal Management
     */
    addJournalEntry(entry: JournalEntry): Promise<void>;
    /**
     * / Media Management
     */
    addProgressPhoto(photo: ProgressPhoto): Promise<bigint>;
    /**
     * / Weight Management
     */
    addWeightEntry(weight: number): Promise<void>;
    /**
     * / Workout Management
     */
    addWorkoutSession(session: WorkoutSession): Promise<bigint>;
    /**
     * / Mixin component functionality
     */
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / BMR Calculation (simplified)
     */
    calculateProfileStats(): Promise<{
        bmr: number;
        proteinTarget: number;
        fatTarget: number;
        carbTarget: number;
        dailyCalories: number;
    }>;
    /**
     * / Exercise Management
     */
    createExercise(exercise: Exercise): Promise<bigint>;
    /**
     * / Habit Management
     */
    createHabit(habit: HabitEntry): Promise<bigint>;
    deleteExercise(id: bigint): Promise<void>;
    getCallerProfile(): Promise<AuraProfile | null>;
    getCallerUserProfile(): Promise<AuraProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExercises(): Promise<Array<Exercise>>;
    getHabits(): Promise<Array<HabitEntry>>;
    getJournals(): Promise<Array<JournalEntry>>;
    getPhotos(): Promise<Array<ProgressPhoto>>;
    getProfile(user: Principal): Promise<AuraProfile>;
    getUserProfile(user: Principal): Promise<AuraProfile | null>;
    getWorkouts(): Promise<Array<WorkoutSession>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Read all profiles (admin permission required).
     */
    readAllProfiles(): Promise<{
        users: Array<Principal>;
        profiles: Array<AuraProfile>;
    }>;
    saveCallerUserProfile(profile: AuraProfile): Promise<void>;
    /**
     * / Core Functions
     * / Profile Management
     */
    saveProfile(profile: AuraProfile): Promise<void>;
    /**
     * / HTTP Outcall Transform
     */
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateExercise(id: bigint, exercise: Exercise): Promise<void>;
}
