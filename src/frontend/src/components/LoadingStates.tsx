import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className = "" }: SkeletonCardProps) {
  const skeletonLines = Array.from({ length: lines - 1 }, (_, i) => i);
  return (
    <div
      className={`bg-card rounded-2xl p-4 border border-border ${className}`}
    >
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        {skeletonLines.map((lineIdx) => (
          <div
            key={`skeleton-${lineIdx}`}
            className="h-3 bg-muted rounded w-full"
          />
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  dataOcid?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  dataOcid,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center gap-4 py-12 px-6 text-center ${className}`}
      data-ocid={dataOcid}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
