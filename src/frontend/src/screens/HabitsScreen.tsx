import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Circle, Flame, Plus, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { HabitType } from "../backend.d";
import { EmptyState, LoadingSpinner } from "../components/LoadingStates";
import { useCreateHabit, useHabits } from "../hooks/useQueries";
import type { HabitEntry } from "../hooks/useQueries";

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (name: string, type: HabitType, description: string) => Promise<void>;
  isPending: boolean;
}

function AddHabitModal({ onClose, onAdd, isPending }: AddHabitModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<HabitType>(HabitType.build);
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a habit name");
      return;
    }
    await onAdd(name.trim(), type, description.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 z-50 flex items-end justify-center"
      data-ocid="habits.add_habit.modal"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-card border-t border-border rounded-t-3xl w-full max-w-[430px] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-foreground">
            New Habit
          </h3>
          <button
            type="button"
            data-ocid="habits.add_habit.close_button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1">
          <label htmlFor="habit-name" className="text-sm text-muted-foreground">
            Habit name
          </label>
          <Input
            id="habit-name"
            data-ocid="habits.add_habit.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning meditation"
            className="bg-muted/50 border-border rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Type</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-ocid="habits.type_build.toggle"
              onClick={() => setType(HabitType.build)}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                type === HabitType.build
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-muted/30 border-border text-muted-foreground"
              }`}
            >
              Build Habit
            </button>
            <button
              type="button"
              data-ocid="habits.type_quit.toggle"
              onClick={() => setType(HabitType.quit)}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                type === HabitType.quit
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                  : "bg-muted/30 border-border text-muted-foreground"
              }`}
            >
              Quit Habit
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="habit-desc-field"
            className="text-sm text-muted-foreground"
          >
            Description (optional)
          </label>
          <Textarea
            id="habit-desc-field"
            data-ocid="habits.add_habit.textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why is this habit important?"
            className="bg-muted/50 border-border rounded-xl resize-none"
            rows={3}
          />
        </div>
        <Button
          data-ocid="habits.add_habit.submit_button"
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
        >
          {isPending ? "Adding..." : "Add Habit"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

interface HabitCardProps {
  habit: HabitEntry;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

function HabitCard({ habit, index, isCompleted, onToggle }: HabitCardProps) {
  const isBuild = habit.habitType === HabitType.build;
  const completionPercent = Math.round(habit.completionRate * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`habits.item.${index + 1}`}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          data-ocid={`habits.checkbox.${index + 1}`}
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
        >
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`font-semibold text-foreground truncate ${
                isCompleted ? "line-through opacity-60" : ""
              }`}
            >
              {habit.name}
            </span>
            <Badge
              className={`flex-shrink-0 text-xs px-2 py-0 ${
                isBuild
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-orange-500/20 text-orange-400 border-orange-500/30"
              }`}
              variant="outline"
            >
              {isBuild ? "BUILD" : "QUIT"}
            </Badge>
          </div>
          {habit.description && (
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {habit.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress value={completionPercent} className="h-1.5 bg-muted" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completionPercent}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-orange-400 flex-shrink-0">
          <Flame size={14} />
          <span className="text-sm font-semibold">
            {String(habit.streakCount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function HabitsScreen() {
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const [showAddModal, setShowAddModal] = useState(false);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const handleAddHabit = async (
    name: string,
    type: HabitType,
    description: string,
  ) => {
    try {
      await createHabit.mutateAsync({
        id: 0n,
        name,
        habitType: type,
        description: description || undefined,
        streakCount: 0n,
        completionRate: 0,
      });
      toast.success("Habit added!");
    } catch {
      toast.error("Failed to add habit");
    }
  };

  const handleToggle = (habitId: string) => {
    setCompletedToday((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
        toast.success("Habit marked as done!");
      }
      return next;
    });
  };

  const buildHabits =
    habits?.filter((h) => h.habitType === HabitType.build) ?? [];
  const quitHabits =
    habits?.filter((h) => h.habitType === HabitType.quit) ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Habits
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {habits?.length ?? 0} habits tracked
          </p>
        </div>
        <Button
          data-ocid="habits.add_habit.primary_button"
          onClick={() => setShowAddModal(true)}
          className="rounded-2xl bg-primary text-primary-foreground h-10 px-4 font-medium flex items-center gap-1"
        >
          <Plus size={16} />
          Add Habit
        </Button>
      </div>

      {habits && habits.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">
                Today's progress
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {completedToday.size} / {habits.length} done
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 space-y-6">
        {isLoading ? (
          <LoadingSpinner message="Loading habits..." />
        ) : !habits?.length ? (
          <EmptyState
            dataOcid="habits.list.empty_state"
            icon={<CheckCircle size={32} />}
            title="No habits yet"
            description="Start building better habits today."
            action={
              <Button
                data-ocid="habits.empty.primary_button"
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-primary-foreground rounded-xl"
              >
                Add First Habit
              </Button>
            }
          />
        ) : (
          <>
            {buildHabits.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">
                    Building
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {buildHabits.length} habits
                  </span>
                </div>
                <div className="space-y-2">
                  {buildHabits.map((habit, i) => (
                    <HabitCard
                      key={String(habit.id)}
                      habit={habit}
                      index={i}
                      isCompleted={completedToday.has(String(habit.id))}
                      onToggle={() => handleToggle(String(habit.id))}
                    />
                  ))}
                </div>
              </div>
            )}
            {quitHabits.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-sm font-semibold text-foreground">
                    Quitting
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {quitHabits.length} habits
                  </span>
                </div>
                <div className="space-y-2">
                  {quitHabits.map((habit, i) => (
                    <HabitCard
                      key={String(habit.id)}
                      habit={habit}
                      index={buildHabits.length + i}
                      isCompleted={completedToday.has(String(habit.id))}
                      onToggle={() => handleToggle(String(habit.id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddHabitModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddHabit}
            isPending={createHabit.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
