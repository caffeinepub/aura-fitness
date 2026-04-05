import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Play,
  Plus,
  Search,
  Square,
  Timer,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState, LoadingSpinner } from "../components/LoadingStates";
import {
  useAddWorkout,
  useCreateExercise,
  useExercises,
  useWorkouts,
} from "../hooks/useQueries";
import type {
  Exercise,
  WorkoutExercise,
  WorkoutSession,
} from "../hooks/useQueries";

const PREDEFINED_EXERCISES: Omit<Exercise, "id" | "creator">[] = [
  { name: "Bench Press", muscleGroup: "Chest" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest" },
  { name: "Push-ups", muscleGroup: "Chest" },
  { name: "Pull-ups", muscleGroup: "Back" },
  { name: "Bent-over Row", muscleGroup: "Back" },
  { name: "Lat Pulldown", muscleGroup: "Back" },
  { name: "Deadlift", muscleGroup: "Back" },
  { name: "Overhead Press", muscleGroup: "Shoulders" },
  { name: "Lateral Raises", muscleGroup: "Shoulders" },
  { name: "Front Raises", muscleGroup: "Shoulders" },
  { name: "Squat", muscleGroup: "Legs" },
  { name: "Romanian Deadlift", muscleGroup: "Legs" },
  { name: "Leg Press", muscleGroup: "Legs" },
  { name: "Lunges", muscleGroup: "Legs" },
  { name: "Leg Curl", muscleGroup: "Legs" },
  { name: "Bicep Curl", muscleGroup: "Arms" },
  { name: "Hammer Curl", muscleGroup: "Arms" },
  { name: "Tricep Pushdown", muscleGroup: "Arms" },
  { name: "Skull Crushers", muscleGroup: "Arms" },
  { name: "Plank", muscleGroup: "Core" },
  { name: "Crunches", muscleGroup: "Core" },
  { name: "Cable Row", muscleGroup: "Back" },
];

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
];

// ---- REST TIMER ----
function RestTimer({ onDismiss }: { onDismiss: () => void }) {
  const [seconds, setSeconds] = useState(90);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) return;
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [done]);

  const adjust = (delta: number) => {
    setSeconds((prev) => Math.max(0, prev + delta));
    setDone(false);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center px-6"
      data-ocid="workout.rest_timer.modal"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm text-center shadow-card"
      >
        {done ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">
              Ready for next set!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Rest complete. You've got this!
            </p>
            <Button
              data-ocid="workout.rest_timer.confirm_button"
              onClick={onDismiss}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              Start Next Set
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Rest Time
              </span>
            </div>
            <div className="text-7xl font-display font-bold text-foreground tabular-nums mb-6">
              {String(mins).padStart(1, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div className="flex gap-2 justify-center mb-6">
              <Button
                data-ocid="workout.rest_timer.secondary_button"
                onClick={() => adjust(-30)}
                variant="outline"
                className="rounded-xl border-border h-11 px-4"
              >
                -30s
              </Button>
              <Button
                data-ocid="workout.rest_skip.button"
                onClick={onDismiss}
                variant="outline"
                className="rounded-xl border-border h-11 px-4"
              >
                Skip Rest
              </Button>
              <Button
                data-ocid="workout.rest_extend.button"
                onClick={() => adjust(30)}
                variant="outline"
                className="rounded-xl border-border h-11 px-4"
              >
                +30s
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---- EXERCISE PICKER ----
interface ExercisePickerProps {
  backendExercises: Exercise[];
  onSelect: (exercise: Omit<Exercise, "id" | "creator">) => void;
  onClose: () => void;
  onCreateCustom: (name: string, muscleGroup: string) => void;
}

function ExercisePicker({
  backendExercises,
  onSelect,
  onClose,
  onCreateCustom,
}: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("Other");

  const allExercises = [
    ...PREDEFINED_EXERCISES,
    ...backendExercises.map((e) => ({
      name: e.name,
      muscleGroup: e.muscleGroup,
    })),
  ];

  const filtered = allExercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      muscleFilter === "All" || e.muscleGroup === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const unique = filtered.filter(
    (ex, idx, arr) => arr.findIndex((e) => e.name === ex.name) === idx,
  );

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    onCreateCustom(customName.trim(), customMuscle);
    onSelect({ name: customName.trim(), muscleGroup: customMuscle });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 z-50 flex items-end justify-center"
      data-ocid="workout.exercise_picker.modal"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-card border-t border-border rounded-t-3xl w-full max-w-[430px] h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">
            Add Exercise
          </h3>
          <button
            type="button"
            data-ocid="workout.exercise_picker.close_button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="workout.exercise_picker.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-muted/50 border-border rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MUSCLE_GROUPS.map((g) => (
              <button
                type="button"
                key={g}
                data-ocid="workout.filter.tab"
                onClick={() => setMuscleFilter(g)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  muscleFilter === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <button
            type="button"
            data-ocid="workout.create_exercise.button"
            onClick={() => setShowCustom(!showCustom)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium text-left"
          >
            <Plus size={16} />
            Create Custom Exercise
          </button>

          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/30 rounded-xl p-3 space-y-2 mt-1">
                  <Input
                    data-ocid="workout.custom_exercise.input"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Exercise name"
                    className="bg-card border-border rounded-lg"
                  />
                  <select
                    data-ocid="workout.custom_exercise.select"
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    {[...MUSCLE_GROUPS.slice(1), "Other"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <Button
                    data-ocid="workout.custom_exercise.submit_button"
                    onClick={handleCreateCustom}
                    size="sm"
                    className="w-full rounded-lg bg-primary"
                  >
                    Add Custom Exercise
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {unique.map((exercise) => (
            <button
              type="button"
              key={exercise.name}
              data-ocid="workout.exercise.item.1"
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-foreground">
                {exercise.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {exercise.muscleGroup}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---- ACTIVE WORKOUT ----
interface LocalExercise {
  id: bigint;
  name: string;
  muscleGroup: string;
  sets: { weight: string; reps: string; notes: string; completed: boolean }[];
}

interface ActiveWorkoutProps {
  exercises: LocalExercise[];
  onEndWorkout: () => void;
  onAddSet: (exIdx: number) => void;
  onSetChange: (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps" | "notes",
    value: string,
  ) => void;
  onDoneSet: (exIdx: number, setIdx: number) => void;
  onAddExercise: () => void;
  elapsedSeconds: number;
}

function ActiveWorkout({
  exercises,
  onEndWorkout,
  onAddSet,
  onSetChange,
  onDoneSet,
  onAddExercise,
  elapsedSeconds,
}: ActiveWorkoutProps) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;

  return (
    <div className="flex flex-col min-h-screen">
      <div
        className="px-4 pt-12 pb-4 flex items-center justify-between border-b border-border sticky top-0 bg-background z-10"
        style={{ backdropFilter: "blur(20px)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Active Workout
            </span>
          </div>
          <div className="text-3xl font-display font-bold text-foreground tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>
        <Button
          data-ocid="workout.end_workout.button"
          onClick={onEndWorkout}
          variant="outline"
          className="rounded-xl border-destructive text-destructive hover:bg-destructive/10 h-11"
        >
          <Square size={14} className="mr-1" />
          End Workout
        </Button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {exercises.map((ex, exIdx) => (
          <div
            key={String(ex.id)}
            data-ocid={`workout.exercise.item.${exIdx + 1}`}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <div>
                <p className="font-semibold text-foreground">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.muscleGroup}
                </p>
              </div>
              <button
                type="button"
                data-ocid={`workout.add_set.button.${exIdx + 1}`}
                onClick={() => onAddSet(exIdx)}
                className="flex items-center gap-1 text-xs text-primary px-3 py-1.5 rounded-lg bg-primary/10"
              >
                <Plus size={12} /> Add Set
              </button>
            </div>

            <div className="p-2 space-y-1">
              <div className="grid grid-cols-[36px_1fr_1fr_80px] gap-2 px-2 text-xs text-muted-foreground">
                <span className="text-center">Set</span>
                <span className="text-center">Weight</span>
                <span className="text-center">Reps</span>
                <span className="text-center">Done</span>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div
                  key={`set-${String(ex.id)}-${setIdx}`}
                  className={`grid grid-cols-[36px_1fr_1fr_80px] gap-2 px-2 py-1 rounded-xl transition-colors ${set.completed ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {setIdx + 1}
                    </span>
                  </div>
                  <Input
                    data-ocid={`workout.set_weight.input.${setIdx + 1}`}
                    value={set.weight}
                    onChange={(e) =>
                      onSetChange(exIdx, setIdx, "weight", e.target.value)
                    }
                    placeholder="kg"
                    type="number"
                    inputMode="decimal"
                    disabled={set.completed}
                    className="h-9 text-center bg-muted/30 border-0 rounded-lg text-sm disabled:opacity-50"
                  />
                  <Input
                    data-ocid={`workout.set_reps.input.${setIdx + 1}`}
                    value={set.reps}
                    onChange={(e) =>
                      onSetChange(exIdx, setIdx, "reps", e.target.value)
                    }
                    placeholder="reps"
                    type="number"
                    inputMode="numeric"
                    disabled={set.completed}
                    className="h-9 text-center bg-muted/30 border-0 rounded-lg text-sm disabled:opacity-50"
                  />
                  <Button
                    data-ocid={`workout.done_set.button.${setIdx + 1}`}
                    onClick={() => onDoneSet(exIdx, setIdx)}
                    disabled={set.completed}
                    size="sm"
                    className={`h-9 rounded-lg text-xs font-medium ${
                      set.completed
                        ? "bg-primary/20 text-primary border-0"
                        : "bg-primary text-primary-foreground"
                    }`}
                    variant={set.completed ? "outline" : "default"}
                  >
                    {set.completed ? <CheckCircle2 size={14} /> : "Done"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          data-ocid="workout.add_exercise.button"
          onClick={onAddExercise}
          variant="outline"
          className="w-full h-14 rounded-2xl border-dashed border-border text-muted-foreground font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Exercise
        </Button>
      </div>
    </div>
  );
}

// ---- WORKOUT SUMMARY ----
function WorkoutSummary({
  session,
  onDone,
}: { session: WorkoutSession; onDone: () => void }) {
  const totalMin = session.totalDuration
    ? Math.round(Number(session.totalDuration) / 60)
    : 0;
  const activeMin = session.activeTime
    ? Math.round(Number(session.activeTime) / 60)
    : 0;
  const restMin = session.restTime
    ? Math.round(Number(session.restTime) / 60)
    : 0;
  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );

  return (
    <div className="flex flex-col min-h-screen px-4">
      <div className="pt-12 pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h2 className="text-2xl font-display font-bold text-foreground">
            Great workout!
          </h2>
          <p className="text-muted-foreground mt-1">
            You crushed it today. Keep going!
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Total Time",
            value: `${totalMin}m`,
            icon: <Clock size={16} />,
          },
          { label: "Active", value: `${activeMin}m`, icon: <Play size={16} /> },
          { label: "Rest", value: `${restMin}m`, icon: <Timer size={16} /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-2xl p-3 text-center"
          >
            <div className="text-primary flex justify-center mb-1">
              {stat.icon}
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-foreground">
            {session.exercises.length} Exercises · {totalSets} Sets
          </p>
        </div>
        <div className="p-2 space-y-1">
          {session.exercises.map((ex, i) => (
            <div
              key={String(ex.id)}
              data-ocid={`workout.summary.item.${i + 1}`}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-sm font-medium text-foreground">
                {ex.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {ex.sets.length} sets
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        data-ocid="workout.summary.confirm_button"
        onClick={onDone}
        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold"
      >
        Done
      </Button>
    </div>
  );
}

// ---- MAIN WORKOUT SCREEN ----
export function WorkoutScreen() {
  const { data: workouts, isLoading } = useWorkouts();
  const { data: backendExercises = [] } = useExercises();
  const addWorkout = useAddWorkout();
  const createExercise = useCreateExercise();

  const [view, setView] = useState<"list" | "active" | "summary">("list");
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (view === "active") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  const handleStartWorkout = () => {
    setExercises([]);
    setStartTime(new Date());
    setElapsedSeconds(0);
    setRestSeconds(0);
    setView("active");
  };

  const handleAddExercise = (exercise: Omit<Exercise, "id" | "creator">) => {
    const newEx: LocalExercise = {
      id: BigInt(Date.now()),
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [{ weight: "", reps: "", notes: "", completed: false }],
    };
    setExercises((prev) => [...prev, newEx]);
  };

  const handleCreateCustomExercise = async (
    name: string,
    muscleGroup: string,
  ) => {
    try {
      await createExercise.mutateAsync({
        id: 0n,
        creator: { _arr: new Uint8Array(29), _isPrincipal: true } as any,
        name,
        muscleGroup,
      });
    } catch {
      // Silent fail
    }
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                { weight: "", reps: "", notes: "", completed: false },
              ],
            }
          : ex,
      ),
    );
  };

  const handleSetChange = (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps" | "notes",
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const handleDoneSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, completed: true } : s,
              ),
            }
          : ex,
      ),
    );
    setRestSeconds((prev) => prev + 90);
    setShowRestTimer(true);
  };

  const handleEndWorkout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const endTime = new Date();
    const totalDuration = BigInt(
      Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
    );
    const activeTime = totalDuration - BigInt(Math.floor(restSeconds));

    const workoutExercises: WorkoutExercise[] = exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.id,
      name: ex.name,
      sets: ex.sets
        .filter((s) => s.completed)
        .map((s) => ({
          weight: Number.parseFloat(s.weight) || 0,
          reps: BigInt(Number.parseInt(s.reps) || 0),
          completed: true,
          notes: s.notes || undefined,
          timestamp: BigInt(Date.now()) * 1_000_000n,
        })),
    }));

    const session: WorkoutSession = {
      id: 0n,
      startTime: BigInt(startTime.getTime()) * 1_000_000n,
      endTime: BigInt(endTime.getTime()) * 1_000_000n,
      totalDuration,
      exercises: workoutExercises,
      restTime: BigInt(Math.floor(restSeconds)),
      activeTime: activeTime > 0n ? activeTime : 0n,
    };

    try {
      await addWorkout.mutateAsync(session);
      setSavedSession(session);
      setView("summary");
    } catch {
      toast.error("Failed to save workout");
    }
  };

  if (view === "active") {
    return (
      <>
        <AnimatePresence>
          {showRestTimer && (
            <RestTimer onDismiss={() => setShowRestTimer(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showExercisePicker && (
            <ExercisePicker
              backendExercises={backendExercises}
              onSelect={handleAddExercise}
              onClose={() => setShowExercisePicker(false)}
              onCreateCustom={handleCreateCustomExercise}
            />
          )}
        </AnimatePresence>
        <ActiveWorkout
          exercises={exercises}
          onEndWorkout={handleEndWorkout}
          onAddSet={handleAddSet}
          onSetChange={handleSetChange}
          onDoneSet={handleDoneSet}
          onAddExercise={() => setShowExercisePicker(true)}
          elapsedSeconds={elapsedSeconds}
        />
      </>
    );
  }

  if (view === "summary" && savedSession) {
    return (
      <WorkoutSummary session={savedSession} onDone={() => setView("list")} />
    );
  }

  const sortedWorkouts = [...(workouts ?? [])].sort(
    (a, b) => Number(b.startTime) - Number(a.startTime),
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Workouts
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track your training sessions
        </p>
      </div>

      <div className="px-4 mb-4">
        <Button
          data-ocid="workout.start_workout.primary_button"
          onClick={handleStartWorkout}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base flex items-center gap-2 shadow-glow"
        >
          <Play size={20} />
          Start Workout
        </Button>
      </div>

      <div className="flex-1 px-4 space-y-3">
        {isLoading ? (
          <LoadingSpinner message="Loading workouts..." />
        ) : !sortedWorkouts.length ? (
          <EmptyState
            dataOcid="workout.list.empty_state"
            icon={<Dumbbell size={32} />}
            title="No workouts yet"
            description="Start your first workout to begin tracking."
            action={
              <Button
                data-ocid="workout.empty.primary_button"
                onClick={handleStartWorkout}
                className="bg-primary text-primary-foreground rounded-xl"
              >
                Start First Workout
              </Button>
            }
          />
        ) : (
          sortedWorkouts.map((workout, i) => {
            const date = new Date(Number(workout.startTime) / 1_000_000);
            const duration = workout.totalDuration
              ? Math.round(Number(workout.totalDuration) / 60)
              : null;
            const totalSets = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.length,
              0,
            );
            const exerciseNames = workout.exercises
              .map((e) => e.name)
              .join(", ");
            const truncatedNames =
              exerciseNames.length > 40
                ? `${exerciseNames.slice(0, 40)}...`
                : exerciseNames;

            return (
              <motion.div
                key={String(workout.id)}
                data-ocid={`workout.list.item.${i + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {workout.exercises.length > 0
                        ? truncatedNames
                        : "Workout Session"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    {duration && (
                      <span className="text-sm font-medium text-primary">
                        {duration} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {workout.exercises.length} exercises
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {totalSets} sets
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
