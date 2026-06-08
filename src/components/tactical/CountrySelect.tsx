import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CountryCode } from "@/hooks/useTacticalBoard";
import { COUNTRIES, Flag } from "./flags/Flags";

interface Props {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  /** "card" = wrapped in surface card, "bare" = naked trigger for sidebar use. */
  variant?: "card" | "bare";
}

export function CountrySelect({ value, onChange, variant = "card" }: Props) {
  const trigger = (
    <Select value={value} onValueChange={(v) => onChange(v as CountryCode)}>
      <SelectTrigger className="h-10 w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="h-5 w-7 overflow-hidden rounded-sm ring-1 ring-border">
              <Flag code={value} className="h-full w-full" />
            </span>
            <span className="truncate text-sm">{COUNTRIES.find((c) => c.code === value)?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <div className="flex items-center gap-2">
              <span className="h-5 w-7 overflow-hidden rounded-sm ring-1 ring-border">
                <Flag code={c.code} className="h-full w-full" />
              </span>
              {c.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (variant === "bare") {
    return (
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Adversário
        </h3>
        {trigger}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-[var(--shadow-md)] backdrop-blur">
      <span className="hidden text-xs font-bold uppercase tracking-widest text-muted-foreground sm:inline">
        Adversário
      </span>
      <div className="min-w-[150px]">{trigger}</div>
    </div>
  );
}
