import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, IdCard as IdIcon } from "lucide-react";

interface Props {
  nashId: string;
  firstName: string;
  lastName: string;
  schoolName?: string | null;
  province?: string | null;
  photoUrl?: string | null;
  verified?: boolean;
  ssLinked?: boolean;
}

/**
 * NASH ID card surface — used on athlete profiles, team-sheet exports, and the
 * dedicated `/athletes/id-cards` printable view. Designed to fit a CR80
 * landscape aspect at any pixel size (85.6mm × 54mm equivalent).
 */
export function NashIdCard({ nashId, firstName, lastName, schoolName, province, photoUrl, verified, ssLinked }: Props) {
  return (
    <Card className="overflow-hidden border-accent/30 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground"
          style={{ aspectRatio: "85.6/54", maxWidth: 420 }}>
      <CardContent className="p-3 h-full flex gap-3">
        {/* Photo or placeholder */}
        <div className="w-1/3 shrink-0 rounded border border-accent/40 bg-background/10 flex items-center justify-center overflow-hidden">
          {photoUrl
            ? <img src={photoUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
            : <IdIcon className="h-10 w-10 text-accent opacity-50" />}
        </div>
        {/* Identity */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-display tracking-[0.2em] uppercase text-accent">NASH ID</span>
              {verified && <Badge variant="outline" className="text-[9px] border-accent/60 text-accent gap-0.5"><ShieldCheck className="h-2.5 w-2.5" /> Verified</Badge>}
            </div>
            <div className="font-mono text-sm text-accent mt-0.5">{nashId}</div>
            <div className="font-display font-bold text-lg leading-tight mt-1 truncate">{firstName} {lastName}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] truncate opacity-90">{schoolName ?? "—"}</div>
            <div className="text-[10px] opacity-70 flex items-center gap-2">
              {province && <span>{province}</span>}
              {ssLinked && <Badge variant="outline" className="text-[8px] border-accent/40 text-accent">SS-Linked</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
