import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Zimbabwe's 10 provinces in canonical NASH order.
export const ZIM_PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
] as const;

export type Province = typeof ZIM_PROVINCES[number];

const CODES: Record<string, string> = {
  Harare: "HR", Bulawayo: "BY", Manicaland: "MA",
  "Mashonaland Central": "MC", "Mashonaland East": "ME", "Mashonaland West": "MW",
  Masvingo: "MS", "Matabeleland North": "MN", "Matabeleland South": "MT", Midlands: "MD",
};

export function provinceCode(name: string): string {
  return CODES[name] ?? name.slice(0, 2).toUpperCase();
}

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  /** Optional "All Provinces" entry for filters. */
  allOption?: boolean;
  className?: string;
  placeholder?: string;
}

export function ProvinceSelector({ value, onChange, allOption, className, placeholder = "Select province" }: Props) {
  return (
    <Select value={value || (allOption ? "__all__" : undefined)} onValueChange={(v) => onChange?.(v === "__all__" ? "" : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOption && <SelectItem value="__all__">All Provinces</SelectItem>}
        {ZIM_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
