// Running deferral count displayed in step card footer

export type DeferralCounterProps = {
  count: number;
};

export function DeferralCounter({ count }: DeferralCounterProps) {
  if (count === 0) return null;

  return <span className="text-xs text-muted-foreground">Running deferrals: {count}</span>;
}
