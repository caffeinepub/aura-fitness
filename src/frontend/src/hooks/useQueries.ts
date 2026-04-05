import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuraProfile,
  Exercise,
  HabitEntry,
  JournalEntry,
  ProgressPhoto,
  WeightEntry,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from "../backend.d";
import { useActor } from "./useActor";

// ——————————————————————————————
// Profile
// ——————————————————————————————
export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<AuraProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: AuraProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useAddWeightEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (weight: number) => {
      if (!actor) throw new Error("No actor");
      await actor.addWeightEntry(weight);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profileStats"] });
    },
  });
}

export function useProfileStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["profileStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.calculateProfileStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ——————————————————————————————
// Workouts
// ——————————————————————————————
export function useWorkouts() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["workouts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWorkouts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWorkout() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: WorkoutSession) => {
      if (!actor) throw new Error("No actor");
      return actor.addWorkoutSession(session);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

// ——————————————————————————————
// Exercises
// ——————————————————————————————
export function useExercises() {
  const { actor, isFetching } = useActor();
  return useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExercises();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateExercise() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: Exercise) => {
      if (!actor) throw new Error("No actor");
      return actor.createExercise(exercise);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

// ——————————————————————————————
// Habits
// ——————————————————————————————
export function useHabits() {
  const { actor, isFetching } = useActor();
  return useQuery<HabitEntry[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHabits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateHabit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habit: HabitEntry) => {
      if (!actor) throw new Error("No actor");
      return actor.createHabit(habit);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

// ——————————————————————————————
// Journals
// ——————————————————————————————
export function useJournals() {
  const { actor, isFetching } = useActor();
  return useQuery<JournalEntry[]>({
    queryKey: ["journals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getJournals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddJournal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: JournalEntry) => {
      if (!actor) throw new Error("No actor");
      await actor.addJournalEntry(entry);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journals"] }),
  });
}

// ——————————————————————————————
// Progress Photos
// ——————————————————————————————
export function usePhotos() {
  const { actor, isFetching } = useActor();
  return useQuery<ProgressPhoto[]>({
    queryKey: ["photos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPhotos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPhoto() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: ProgressPhoto) => {
      if (!actor) throw new Error("No actor");
      return actor.addProgressPhoto(photo);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
}

// ——————————————————————————————
// Re-exports for convenience
// ——————————————————————————————
export type {
  AuraProfile,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
  HabitEntry,
  JournalEntry,
  ProgressPhoto,
  WeightEntry,
};
