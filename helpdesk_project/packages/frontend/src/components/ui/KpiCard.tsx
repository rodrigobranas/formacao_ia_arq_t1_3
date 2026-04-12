import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  className?: string;
}

const KpiCard = ({ label, value, icon, className }: KpiCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-accent/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">
        {String(value)}
      </p>
    </div>
  );
};

export default KpiCard;
