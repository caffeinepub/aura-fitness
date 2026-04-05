import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Scale, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { EmptyState, LoadingSpinner } from "../components/LoadingStates";
import { useActor } from "../hooks/useActor";
import {
  useAddPhoto,
  useAddWeightEntry,
  useHabits,
  usePhotos,
  useProfile,
  useProfileStats,
} from "../hooks/useQueries";
import type { WeightEntry } from "../hooks/useQueries";

// --- Weight Chart (SVG) ---
function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Scale size={24} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Log at least 2 weight entries to see your chart
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  );
  const weights = sorted.map((e) => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const W = 320;
  const H = 140;
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = sorted.map((e, i) => {
    const x = PAD.left + (i / (sorted.length - 1)) * chartW;
    const y = PAD.top + chartH - ((e.weight - minW) / range) * chartH;
    return { x, y, w: e.weight, ts: Number(e.timestamp) / 1_000_000 };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.top + chartH} L ${PAD.left} ${PAD.top + chartH} Z`;

  const yTicks = [minW, (minW + maxW) / 2, maxW];
  const xLabels = sorted.filter(
    (_, i) =>
      i === 0 || i === sorted.length - 1 || i === Math.floor(sorted.length / 2),
  );

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Weight history chart"
      role="img"
    >
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.57 0.2 265)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="oklch(0.57 0.2 265)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.57 0.2 265)" />
          <stop offset="100%" stopColor="oklch(0.62 0.18 195)" />
        </linearGradient>
      </defs>

      {yTicks.map((t) => {
        const y = PAD.top + chartH - ((t - minW) / range) * chartH;
        return (
          <g key={`ytick-${t.toFixed(1)}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + chartW}
              y1={y}
              y2={y}
              stroke="oklch(0.265 0.014 265)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              fill="oklch(0.61 0.012 265)"
              fontSize="10"
              textAnchor="end"
            >
              {t.toFixed(1)}
            </text>
          </g>
        );
      })}

      <path d={areaD} fill="url(#weightGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={`pt-${i}-${p.w}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="oklch(0.57 0.2 265)"
          stroke="oklch(0.155 0.01 265)"
          strokeWidth="2"
        />
      ))}

      {xLabels.map((e, idx) => {
        const origIdx = sorted.findIndex((s) => s.timestamp === e.timestamp);
        const x = PAD.left + (origIdx / (sorted.length - 1)) * chartW;
        const date = new Date(Number(e.timestamp) / 1_000_000);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        return (
          <text
            key={`xlabel-${idx}-${label}`}
            x={x}
            y={H - 4}
            fill="oklch(0.61 0.012 265)"
            fontSize="10"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// --- Habit Bar Chart ---
function HabitBarChart({
  habits,
}: { habits: Array<{ name: string; completionRate: number }> }) {
  if (!habits.length) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No habits to display
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <div key={habit.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground truncate max-w-[200px]">
              {habit.name}
            </span>
            <span className="text-muted-foreground">
              {Math.round(habit.completionRate * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${habit.completionRate * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Log Weight Modal ---
function LogWeightModal({
  onClose,
  onLog,
  isPending,
}: {
  onClose: () => void;
  onLog: (weight: number) => Promise<void>;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = async () => {
    const w = Number.parseFloat(value);
    if (!w || w <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    await onLog(w);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 z-50 flex items-end justify-center"
      data-ocid="progress.log_weight.modal"
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
            Log Weight
          </h3>
          <button
            type="button"
            data-ocid="progress.log_weight.close_button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="weight-input"
            className="text-sm text-muted-foreground"
          >
            Weight (kg)
          </label>
          <Input
            id="weight-input"
            data-ocid="progress.weight.input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., 75.5"
            type="number"
            inputMode="decimal"
            className="bg-muted/50 border-border rounded-xl text-center text-2xl font-bold h-14"
            autoFocus
          />
        </div>
        <Button
          data-ocid="progress.log_weight.submit_button"
          onClick={handleSubmit}
          disabled={isPending || !value}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
        >
          {isPending ? "Saving..." : "Save Weight"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// --- Photo Compare Modal ---
function PhotoCompareModal({
  photo1,
  photo2,
  onClose,
}: {
  photo1: string;
  photo2: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 z-50 flex flex-col"
      data-ocid="progress.photo_compare.modal"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display font-bold text-foreground">Compare</h3>
        <button
          type="button"
          data-ocid="progress.photo_compare.close_button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2 p-4">
        <img
          src={photo1}
          alt="Before progress"
          className="w-full h-full object-cover rounded-2xl"
        />
        <img
          src={photo2}
          alt="After progress"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    </motion.div>
  );
}

export function ProgressScreen() {
  const [tab, setTab] = useState<"weight" | "habits" | "photos">("weight");
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [comparePhotos, setComparePhotos] = useState<[string, string] | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: stats } = useProfileStats();
  const addWeight = useAddWeightEntry();
  const { data: habits, isLoading: loadingHabits } = useHabits();
  const { data: photos, isLoading: loadingPhotos } = usePhotos();
  const addPhoto = useAddPhoto();
  const { actor } = useActor();

  const weightHistory = profile?.weightHistory ?? [];
  const sortedWeights = [...weightHistory].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  const handleLogWeight = async (weight: number) => {
    try {
      await addWeight.mutateAsync(weight);
      toast.success(`Weight logged: ${weight} kg`);
    } catch {
      toast.error("Failed to log weight");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!actor) return;
    try {
      setUploadProgress(0);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      blob.onProgress = (p) => setUploadProgress(p);
      const photo = {
        id: 0n,
        blobId: blob.directURL,
        timestamp: BigInt(Date.now()) * 1_000_000n,
        notes: undefined,
      };
      await addPhoto.mutateAsync(photo);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadProgress(null);
    }
  };

  const handlePhotoSelect = (url: string) => {
    if (!compareMode) return;
    setSelectedPhotos((prev) => {
      if (prev.includes(url)) return prev.filter((p) => p !== url);
      if (prev.length >= 2) return [prev[1], url];
      const next = [...prev, url];
      if (next.length === 2) setComparePhotos([next[0], next[1]]);
      return next;
    });
  };

  const latestWeight = sortedWeights[0];
  const prevWeight = sortedWeights[1];
  const weightDiff =
    latestWeight && prevWeight ? latestWeight.weight - prevWeight.weight : null;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track your transformation
        </p>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-muted/30 rounded-2xl p-1">
          {(["weight", "habits", "photos"] as const).map((t) => (
            <button
              type="button"
              key={t}
              data-ocid={`progress.${t}.tab`}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {tab === "weight" && (
            <motion.div
              key="weight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Button
                data-ocid="progress.log_weight.primary_button"
                onClick={() => setShowLogWeight(true)}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"
              >
                <Scale size={18} />
                Log Weight
              </Button>

              {latestWeight && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Current Weight
                      </p>
                      <p className="text-3xl font-display font-bold text-foreground">
                        {latestWeight.weight}
                        <span className="text-lg text-muted-foreground ml-1">
                          kg
                        </span>
                      </p>
                    </div>
                    {weightDiff !== null && (
                      <div
                        className={`text-right ${weightDiff < 0 ? "text-emerald-400" : "text-orange-400"}`}
                      >
                        <p className="text-2xl font-bold">
                          {weightDiff > 0 ? "+" : ""}
                          {weightDiff.toFixed(1)}
                        </p>
                        <p className="text-xs">from last</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Weight History
                </p>
                {loadingProfile ? (
                  <div className="h-40 bg-muted/30 rounded-xl animate-pulse" />
                ) : (
                  <WeightChart entries={weightHistory} />
                )}
              </div>

              {stats && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Daily Targets
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">BMR</p>
                      <p className="text-xl font-bold text-foreground">
                        {Math.round(stats.bmr)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        kcal/day base
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">
                        Daily Calories
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {Math.round(stats.dailyCalories)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        kcal target
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="text-xl font-bold text-foreground">
                        {Math.round(stats.proteinTarget)}g
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="text-xl font-bold text-foreground">
                        {Math.round(stats.carbTarget)}g
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sortedWeights.length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">
                      History
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {sortedWeights.slice(0, 10).map((entry, i) => (
                      <div
                        key={`weight-entry-${Number(entry.timestamp)}`}
                        data-ocid={`progress.weight.item.${i + 1}`}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="text-sm text-muted-foreground">
                          {new Date(
                            Number(entry.timestamp) / 1_000_000,
                          ).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-foreground">
                          {entry.weight} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "habits" && (
            <motion.div
              key="habits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-4">
                  Completion Rates
                </p>
                {loadingHabits ? (
                  <LoadingSpinner />
                ) : (
                  <HabitBarChart habits={habits ?? []} />
                )}
              </div>

              {habits && habits.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Overall Stats
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {habits.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Active Habits
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(
                          (habits.reduce((s, h) => s + h.completionRate, 0) /
                            habits.length) *
                            100,
                        )}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg Completion
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-orange-400">
                        {String(
                          Math.max(...habits.map((h) => Number(h.streakCount))),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Best Streak
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {
                          habits.filter((h) => Number(h.streakCount) >= 7)
                            .length
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        7+ Day Streaks
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "photos" && (
            <motion.div
              key="photos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  data-ocid="progress.add_photo.primary_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"
                  disabled={uploadProgress !== null}
                >
                  <Camera size={18} />
                  {uploadProgress !== null
                    ? `Uploading ${uploadProgress}%`
                    : "Add Photo"}
                </Button>
                {photos && photos.length >= 2 && (
                  <Button
                    data-ocid="progress.compare.toggle"
                    onClick={() => {
                      setCompareMode(!compareMode);
                      setSelectedPhotos([]);
                    }}
                    variant="outline"
                    className={`h-12 px-4 rounded-2xl border-border ${compareMode ? "border-primary text-primary" : ""}`}
                  >
                    <ZoomIn size={18} />
                  </Button>
                )}
              </div>

              {compareMode && (
                <p className="text-sm text-primary text-center">
                  Select 2 photos to compare
                </p>
              )}

              {loadingPhotos ? (
                <LoadingSpinner message="Loading photos..." />
              ) : !photos?.length ? (
                <EmptyState
                  dataOcid="progress.photos.empty_state"
                  icon={<Camera size={32} />}
                  title="No progress photos"
                  description="Upload your first progress photo."
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, i) => {
                    const url = photo.blobId;
                    const isSelected = selectedPhotos.includes(url);
                    const dateStr = new Date(
                      Number(photo.timestamp) / 1_000_000,
                    ).toLocaleDateString();
                    return (
                      <motion.div
                        key={String(photo.id)}
                        data-ocid={`progress.photos.item.${i + 1}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handlePhotoSelect(url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer ${
                          compareMode
                            ? isSelected
                              ? "ring-2 ring-primary"
                              : "opacity-70"
                            : ""
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Progress ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-white font-bold">
                              {selectedPhotos.indexOf(url) + 1}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white">{dateStr}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showLogWeight && (
          <LogWeightModal
            onClose={() => setShowLogWeight(false)}
            onLog={handleLogWeight}
            isPending={addWeight.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comparePhotos && (
          <PhotoCompareModal
            photo1={comparePhotos[0]}
            photo2={comparePhotos[1]}
            onClose={() => {
              setComparePhotos(null);
              setSelectedPhotos([]);
              setCompareMode(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
