import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Dumbbell, Flame, Plus, Scale } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { TabId } from "../components/BottomNav";
import { SkeletonCard } from "../components/LoadingStates";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useHabits, useProfile, useWorkouts } from "../hooks/useQueries";

interface HomeScreenProps {
  onNavigate: (tab: TabId) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principalStr.slice(0, 5);

  const { data: workouts, isLoading: loadingWorkouts } = useWorkouts();
  const { data: habits, isLoading: loadingHabits } = useHabits();
  const { data: profile, isLoading: loadingProfile } = useProfile();

  const lastWorkout = workouts?.[workouts.length - 1] ?? null;
  const topHabits = [...(habits ?? [])]
    .sort((a, b) => Number(b.streakCount) - Number(a.streakCount))
    .slice(0, 3);

  // Check if weight was logged this week
  const hasWeightThisWeek = (() => {
    if (!profile?.weightHistory?.length) return false;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return profile.weightHistory.some(
      (w) => Number(w.timestamp) / 1_000_000 > oneWeekAgo,
    );
  })();

  // This week's workout count
  const thisWeekWorkouts = (() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (
      workouts?.filter((w) => Number(w.startTime) / 1_000_000 > oneWeekAgo)
        .length ?? 0
    );
  })();

  // Habit completion this week
  const habitCompletion = habits?.length
    ? Math.round(
        (habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length) *
          100,
      )
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-muted-foreground text-sm">
            {formatDate(new Date())}
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground mt-1">
            {getGreeting()}, {shortPrincipal}
          </h1>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">This week</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {thisWeekWorkouts}
            </p>
            <p className="text-xs text-muted-foreground">workouts</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className="text-orange-400" />
              <span className="text-xs text-muted-foreground">Habits done</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {habitCompletion}%
            </p>
            <p className="text-xs text-muted-foreground">completion rate</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            data-ocid="home.workout.primary_button"
            onClick={() => onNavigate("workout")}
            className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-2"
          >
            <Dumbbell size={18} />
            Start Workout
          </Button>
          <Button
            data-ocid="home.habits.secondary_button"
            onClick={() => onNavigate("habits")}
            variant="outline"
            className="h-14 rounded-2xl border-border font-semibold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Log Habit
          </Button>
        </div>

        {/* Today's Habits */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Today's Habits</h2>
            <button
              type="button"
              data-ocid="home.habits.link"
              onClick={() => onNavigate("habits")}
              className="text-xs text-primary"
            >
              View all
            </button>
          </div>
          {loadingHabits ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-muted/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : !habits?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No habits yet. Add your first habit!
            </p>
          ) : (
            <div className="space-y-2">
              {habits.slice(0, 4).map((habit, i) => (
                <div
                  key={String(habit.id)}
                  data-ocid={`home.habits.item.${i + 1}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      habit.completionRate >= 0.5
                        ? "border-primary bg-primary/20"
                        : "border-border"
                    }`}
                  >
                    {habit.completionRate >= 0.5 && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-foreground flex-1 truncate">
                    {habit.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    🔥 {String(habit.streakCount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Workout */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Last Workout</h2>
          </div>
          {loadingWorkouts ? (
            <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ) : !lastWorkout ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No workouts yet</p>
              <Button
                data-ocid="home.start_workout.secondary_button"
                onClick={() => onNavigate("workout")}
                variant="ghost"
                className="text-primary text-sm mt-1 h-auto py-1"
              >
                Start your first workout →
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-foreground font-medium">
                {lastWorkout.exercises.length} exercise
                {lastWorkout.exercises.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-4 mt-1">
                {lastWorkout.totalDuration && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(Number(lastWorkout.totalDuration) / 60)} min
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(Number(lastWorkout.startTime) / 1_000_000),
                    { addSuffix: true },
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Streaks */}
        {topHabits.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-400" />
              <h2 className="font-semibold text-foreground">Top Streaks</h2>
            </div>
            <div className="space-y-2">
              {topHabits.map((habit, i) => (
                <div
                  key={String(habit.id)}
                  data-ocid={`home.streaks.item.${i + 1}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-foreground truncate max-w-[200px]">
                    {habit.name}
                  </span>
                  <span className="text-sm font-semibold text-orange-400">
                    🔥 {String(habit.streakCount)} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weight reminder */}
        {!loadingProfile && !hasWeightThisWeek && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Scale size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Log your weight
                </p>
                <p className="text-xs text-muted-foreground">
                  Keep your metrics up to date
                </p>
              </div>
              <Button
                data-ocid="home.weight.secondary_button"
                onClick={() => onNavigate("progress")}
                size="sm"
                variant="outline"
                className="rounded-xl border-border text-primary text-xs"
              >
                Log
              </Button>
            </div>
          </div>
        )}

        {/* Journal Quick Entry */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span className="font-semibold text-foreground text-sm">
                Weekly Journal
              </span>
            </div>
            <button
              type="button"
              data-ocid="home.journal.link"
              onClick={() => onNavigate("profile")}
              className="text-xs text-primary"
            >
              Write entry →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
