interface StatsCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export default function StatsCard({ title, value, className }: StatsCardProps) {
  return (
    <div className={`bg-card rounded-xl p-6 border border-border ${className}`}>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      <div className="text-3xl font-bold text-card-foreground mt-2">
        {value}
      </div>
    </div>
  );
}