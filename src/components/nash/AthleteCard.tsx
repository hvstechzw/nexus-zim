import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { EligibilityIndicator, type EligibilityStatus } from "./EligibilityIndicator";

interface Props {
  nashId: string;
  firstName: string;
  lastName: string;
  schoolName?: string | null;
  photoUrl?: string | null;
  eligibility?: EligibilityStatus;
  jerseyNumber?: number | null;
  isCaptain?: boolean;
}

/** Compact athlete mini-card for rosters and lookups. */
export function AthleteCard({ nashId, firstName, lastName, schoolName, photoUrl, eligibility, jerseyNumber, isCaptain }: Props) {
  return (
    <Link to={`/players/${nashId}`} className="flex items-center gap-3 p-2 rounded border border-border hover:border-primary/50 transition-colors">
      <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
        {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
            {firstName.charAt(0)}{lastName.charAt(0)}
          </div>}
        {typeof jerseyNumber === "number" && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center border border-background">
            {jerseyNumber}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {firstName} {lastName}{isCaptain && <Badge variant="outline" className="ml-1 text-[9px]">C</Badge>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono text-accent">{nashId}</span>
          {schoolName && <span className="truncate">· {schoolName}</span>}
        </div>
      </div>
      {eligibility && <EligibilityIndicator status={eligibility} />}
    </Link>
  );
}
