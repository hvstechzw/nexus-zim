import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NASH_SPORTS } from "./SportBadge";

interface Props {
  value?: string;
  onChange?: (code: string) => void;
  /** Optional "All Sports" entry for filters. */
  allOption?: boolean;
  className?: string;
  placeholder?: string;
}

export function SportSelector({ value, onChange, allOption, className, placeholder = "Select sport" }: Props) {
  return (
    <Select value={value || (allOption ? "__all__" : undefined)} onValueChange={(v) => onChange?.(v === "__all__" ? "" : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOption && <SelectItem value="__all__">All Sports</SelectItem>}
        {NASH_SPORTS.map((s) => (
          <SelectItem key={s.code} value={s.code}>
            <span className="font-mono text-[10px] text-accent mr-2">{s.code}</span>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
