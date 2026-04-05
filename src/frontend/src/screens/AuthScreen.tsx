import { Button } from "@/components/ui/button";
import { Lock, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Background glow */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: "oklch(0.57 0.2 265)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-display font-bold text-foreground tracking-tight">
              Aura
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Your private fitness companion
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-2 w-full">
          {[
            {
              icon: <Shield size={14} />,
              text: "All data stays private and encrypted",
            },
            {
              icon: <Zap size={14} />,
              text: "Track workouts, habits & progress",
            },
            {
              icon: <Lock size={14} />,
              text: "No ads, no sharing, no surveillance",
            },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
            >
              <span className="text-primary flex-shrink-0">{item.icon}</span>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Sign In */}
        <div className="w-full space-y-3">
          <Button
            data-ocid="auth.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-all"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your data stays private. We never share your information.
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-muted-foreground"
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
