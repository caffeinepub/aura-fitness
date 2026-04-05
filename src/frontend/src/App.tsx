import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "./components/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AuthScreen } from "./screens/AuthScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { WorkoutScreen } from "./screens/WorkoutScreen";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<TabId>("home");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading Aura...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <AuthScreen />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.175 0.012 265)",
              border: "1px solid oklch(0.265 0.014 265)",
              color: "oklch(0.962 0.008 265)",
            },
          }}
        />
      </>
    );
  }

  const tabScreens: Record<TabId, React.ReactNode> = {
    home: <HomeScreen onNavigate={setActiveTab} />,
    workout: <WorkoutScreen />,
    habits: <HabitsScreen />,
    progress: <ProgressScreen />,
    profile: <ProfileScreen />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <div className="max-w-[430px] mx-auto h-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pb-20"
            >
              {tabScreens[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-[430px] mx-auto">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.175 0.012 265)",
            border: "1px solid oklch(0.265 0.014 265)",
            color: "oklch(0.962 0.008 265)",
          },
        }}
      />
    </div>
  );
}
