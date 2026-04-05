import { CheckSquare, Dumbbell, Home, TrendingUp, User } from "lucide-react";
import { motion } from "motion/react";

export type TabId = "home" | "workout" | "habits" | "progress" | "profile";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home size={20} /> },
  { id: "workout", label: "Workout", icon: <Dumbbell size={20} /> },
  { id: "habits", label: "Habits", icon: <CheckSquare size={20} /> },
  { id: "progress", label: "Progress", icon: <TrendingUp size={20} /> },
  { id: "profile", label: "Profile", icon: <User size={20} /> },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="bg-card border-t border-border safe-bottom"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "oklch(0.145 0.01 265 / 0.95)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[52px] min-h-[44px] transition-colors relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-xl bg-primary/15"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
              <span
                className={`transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
