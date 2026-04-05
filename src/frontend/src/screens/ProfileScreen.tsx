import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  LogOut,
  MessageSquare,
  Save,
  Send,
  Star,
  Trophy,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "../components/LoadingStates";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddJournal,
  useHabits,
  useJournals,
  useProfile,
  useSaveProfile,
  useWorkouts,
} from "../hooks/useQueries";
import type { AuraProfile, JournalEntry } from "../hooks/useQueries";

// ---- AI Coach Chat ----
interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: number;
}

const AI_RESPONSES = [
  "Great question! Based on your training history, consistency is your strongest asset. Keep showing up!",
  "Looking at your recent workouts, you're making solid progress. Consider adding progressive overload to your main lifts.",
  "Your habit streaks show real discipline. Remember: discipline is doing it even when motivation is low.",
  "Rest and recovery are as important as training. Make sure you're sleeping 7-9 hours per night.",
  "Based on your workout frequency, you might benefit from a deload week every 4-6 weeks to prevent overtraining.",
  "Nutrition is crucial for your goals. Prioritize protein at each meal to support muscle recovery.",
  "You're building great momentum! Small daily improvements compound into massive results over time.",
  "For optimal performance, stay hydrated throughout the day. Aim for at least 2-3 liters of water daily.",
  "Your consistency is impressive. The hardest part is starting - you've already overcome that!",
  "Consider tracking your perceived exertion after each workout. It helps optimize training intensity.",
];

const STORAGE_KEY = "aura-chat-history";

function loadChatHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch {
    // ignore
  }
}

function AICoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ref is stable
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

    const response =
      AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    const aiMsg: ChatMessage = {
      role: "ai",
      content: response,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 mb-4">
        <p className="text-xs text-primary font-medium">
          Your coach knows your workouts, habits & progress
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-3 pr-1"
        style={{ maxHeight: "calc(100vh - 420px)" }}
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Ask your AI coach anything about fitness, habits, or recovery.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.timestamp}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border text-foreground rounded-tl-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
            data-ocid="profile.ai_coach.loading_state"
          >
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    style={{
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          data-ocid="profile.ai_coach.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask your AI coach anything..."
          className="flex-1 bg-muted/50 border-border rounded-2xl"
          disabled={isTyping}
        />
        <Button
          data-ocid="profile.ai_coach.submit_button"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-11 h-11 rounded-2xl bg-primary p-0 flex-shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

// ---- Journal ----
function JournalSection() {
  const { data: journals, isLoading } = useJournals();
  const addJournal = useAddJournal();
  const [wellText, setWellText] = useState("");
  const [notWellText, setNotWellText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleSave = async () => {
    if (!wellText && !notWellText && !improveText) {
      toast.error("Please fill in at least one field");
      return;
    }
    try {
      await addJournal.mutateAsync({
        whatWentWell: wellText,
        whatDidntGoWell: notWellText,
        whatToImprove: improveText,
        timestamp: BigInt(Date.now()) * 1_000_000n,
      });
      setWellText("");
      setNotWellText("");
      setImproveText("");
      toast.success("Journal entry saved!");
    } catch {
      toast.error("Failed to save journal");
    }
  };

  return (
    <div className="space-y-4">
      {/* New entry */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Weekly Reflection</h3>
        <div className="space-y-1">
          <label
            htmlFor="journal-well"
            className="text-xs text-emerald-400 font-medium"
          >
            What went well this week?
          </label>
          <Textarea
            id="journal-well"
            data-ocid="journal.well.textarea"
            value={wellText}
            onChange={(e) => setWellText(e.target.value)}
            placeholder="Celebrate your wins..."
            rows={2}
            className="bg-muted/50 border-border rounded-xl resize-none text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="journal-not-well"
            className="text-xs text-orange-400 font-medium"
          >
            What didn't go well?
          </label>
          <Textarea
            id="journal-not-well"
            data-ocid="journal.not_well.textarea"
            value={notWellText}
            onChange={(e) => setNotWellText(e.target.value)}
            placeholder="Be honest with yourself..."
            rows={2}
            className="bg-muted/50 border-border rounded-xl resize-none text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="journal-improve"
            className="text-xs text-primary font-medium"
          >
            What can I improve?
          </label>
          <Textarea
            id="journal-improve"
            data-ocid="journal.improve.textarea"
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            placeholder="Focus areas for next week..."
            rows={2}
            className="bg-muted/50 border-border rounded-xl resize-none text-sm"
          />
        </div>
        <Button
          data-ocid="journal.save.submit_button"
          onClick={handleSave}
          disabled={addJournal.isPending}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold"
        >
          {addJournal.isPending ? "Saving..." : "Save Entry"}
        </Button>
      </div>

      {/* Past entries */}
      {isLoading ? (
        <LoadingSpinner />
      ) : journals && journals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Past Entries</p>
          {[...journals]
            .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
            .map((entry, i) => (
              <div
                key={Number(entry.timestamp)}
                data-ocid={`journal.entries.item.${i + 1}`}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(entry.timestamp) / 1_000_000,
                      ).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-foreground truncate max-w-[260px]">
                      {entry.whatWentWell ||
                        entry.whatDidntGoWell ||
                        "Journal entry"}
                    </p>
                  </div>
                  {expandedIdx === i ? (
                    <ChevronUp
                      size={16}
                      className="text-muted-foreground flex-shrink-0"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="text-muted-foreground flex-shrink-0"
                    />
                  )}
                </button>
                <AnimatePresence>
                  {expandedIdx === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {entry.whatWentWell && (
                          <div>
                            <p className="text-xs text-emerald-400 font-medium">
                              Went well
                            </p>
                            <p className="text-sm text-foreground">
                              {entry.whatWentWell}
                            </p>
                          </div>
                        )}
                        {entry.whatDidntGoWell && (
                          <div>
                            <p className="text-xs text-orange-400 font-medium">
                              Didn't go well
                            </p>
                            <p className="text-sm text-foreground">
                              {entry.whatDidntGoWell}
                            </p>
                          </div>
                        )}
                        {entry.whatToImprove && (
                          <div>
                            <p className="text-xs text-primary font-medium">
                              To improve
                            </p>
                            <p className="text-sm text-foreground">
                              {entry.whatToImprove}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- Badges ----
interface AchievementBadge {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  earned: boolean;
}

function computeBadges(
  workoutCount: number,
  maxStreak: number,
  hasProfile: boolean,
): AchievementBadge[] {
  return [
    {
      id: "first_workout",
      icon: <Flame size={20} />,
      title: "First Step",
      description: "Complete your first workout",
      earned: workoutCount >= 1,
    },
    {
      id: "five_workouts",
      icon: <Trophy size={20} />,
      title: "Getting Strong",
      description: "Complete 5 workouts",
      earned: workoutCount >= 5,
    },
    {
      id: "ten_workouts",
      icon: <Star size={20} />,
      title: "Dedicated",
      description: "Complete 10 workouts",
      earned: workoutCount >= 10,
    },
    {
      id: "streak_3",
      icon: <Flame size={20} />,
      title: "Habit Starter",
      description: "Reach a 3-day streak",
      earned: maxStreak >= 3,
    },
    {
      id: "streak_7",
      icon: <Trophy size={20} />,
      title: "Week Warrior",
      description: "Reach a 7-day streak",
      earned: maxStreak >= 7,
    },
    {
      id: "streak_30",
      icon: <Star size={20} />,
      title: "Monthly Master",
      description: "Reach a 30-day streak",
      earned: maxStreak >= 30,
    },
    {
      id: "profile_complete",
      icon: <User size={20} />,
      title: "Identity Set",
      description: "Complete your profile",
      earned: hasProfile,
    },
  ];
}

// ---- Main Profile Screen ----
export function ProfileScreen() {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useProfile();
  const { data: workouts } = useWorkouts();
  const { data: habits } = useHabits();
  const saveProfile = useSaveProfile();

  const [subTab, setSubTab] = useState<"profile" | "coach" | "journal">(
    "profile",
  );

  // Profile form state
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [height, setHeight] = useState("");

  useEffect(() => {
    if (profile) {
      setAge(String(profile.age));
      setSex(profile.biologicalSex || "male");
      setHeight(String(profile.height));
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await saveProfile.mutateAsync({
        age: BigInt(Number.parseInt(age) || 0),
        biologicalSex: sex,
        height: Number.parseFloat(height) || 0,
        weightHistory: profile?.weightHistory ?? [],
      });
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const workoutCount = workouts?.length ?? 0;
  const maxStreak = habits?.length
    ? Math.max(...habits.map((h) => Number(h.streakCount)))
    : 0;
  const hasProfile = !!profile?.age;
  const badges = computeBadges(workoutCount, maxStreak, hasProfile);
  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Profile
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 truncate max-w-[240px]">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </p>
          </div>
          <Button
            data-ocid="profile.signout.button"
            onClick={clear}
            variant="outline"
            className="rounded-xl border-destructive/50 text-destructive h-10 px-3 text-sm"
          >
            <LogOut size={14} className="mr-1" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-muted/30 rounded-2xl p-1">
          {(
            [
              { id: "profile", label: "Profile", icon: <User size={14} /> },
              {
                id: "coach",
                label: "AI Coach",
                icon: <MessageSquare size={14} />,
              },
              { id: "journal", label: "Journal", icon: <BookOpen size={14} /> },
            ] as const
          ).map((t) => (
            <button
              type="button"
              key={t.id}
              data-ocid={`profile.${t.id}.tab`}
              onClick={() => setSubTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                subTab === t.id
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {subTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className="text-3xl font-display font-bold text-foreground">
                    {workoutCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Workouts
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className="text-3xl font-display font-bold text-orange-400">
                    {maxStreak}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Best Streak
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Personal Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="profile-age"
                      className="text-xs text-muted-foreground"
                    >
                      Age
                    </label>
                    <Input
                      id="profile-age"
                      data-ocid="profile.age.input"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      type="number"
                      className="bg-muted/50 border-border rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="profile-height"
                      className="text-xs text-muted-foreground"
                    >
                      Height (cm)
                    </label>
                    <Input
                      id="profile-height"
                      data-ocid="profile.height.input"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="175"
                      type="number"
                      className="bg-muted/50 border-border rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Biological Sex
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {["male", "female", "other"].map((s) => (
                      <button
                        type="button"
                        key={s}
                        data-ocid={`profile.sex_${s}.toggle`}
                        onClick={() => setSex(s)}
                        className={`py-2 rounded-xl text-sm capitalize border transition-colors ${
                          sex === s
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "bg-muted/30 border-border text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  data-ocid="profile.save.submit_button"
                  onClick={handleSaveProfile}
                  disabled={saveProfile.isPending}
                  className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2"
                >
                  <Save size={16} />
                  {saveProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>

              {/* Badges */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">
                    Achievements
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {earnedBadges.length}/{badges.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      data-ocid={`profile.badge.${badge.id}.card`}
                      className={`rounded-xl p-3 flex items-start gap-2 border transition-colors ${
                        badge.earned
                          ? "bg-primary/15 border-primary/30"
                          : "bg-muted/20 border-border opacity-50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 ${
                          badge.earned
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {badge.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Coach Tab */}
          {subTab === "coach" && (
            <motion.div
              key="coach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AICoachChat />
            </motion.div>
          )}

          {/* Journal Tab */}
          {subTab === "journal" && (
            <motion.div
              key="journal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <JournalSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
