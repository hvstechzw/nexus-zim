import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface StandingRow {
  position?: number | null;
  team_name: string;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
  goals_for?: number | null;
  goals_against?: number | null;
  goal_difference?: number | null;
  points?: number | null;
  /** Group label for pooled formats. */
  group_label?: string | null;
}

interface Props {
  rows: StandingRow[];
  /** For racquet/individual sports we hide goals columns; defaults to false. */
  hideGoals?: boolean;
}

/**
 * Sport-aware standings table — used across competition detail pages and the
 * public /standings/:competitionId view. Falls back gracefully when rows are
 * empty so the surface still reads as intentional.
 */
export function StandingsTable({ rows, hideGoals }: Props) {
  const groups = new Map<string, StandingRow[]>();
  rows.forEach((r) => {
    const k = r.group_label || "—";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  });
  const showGroups = groups.size > 1;

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          {showGroups && <div className="text-[10px] font-display tracking-[0.15em] uppercase text-accent border-b border-border pb-1 mb-2">Group {group}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center w-12">P</TableHead>
                <TableHead className="text-center w-12">W</TableHead>
                <TableHead className="text-center w-12">D</TableHead>
                <TableHead className="text-center w-12">L</TableHead>
                {!hideGoals && (
                  <>
                    <TableHead className="text-center w-12">F</TableHead>
                    <TableHead className="text-center w-12">A</TableHead>
                    <TableHead className="text-center w-14">GD</TableHead>
                  </>
                )}
                <TableHead className="text-center w-14">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={hideGoals ? 7 : 10} className="text-center py-6 text-sm text-muted-foreground">No standings yet</TableCell></TableRow>
              )}
              {items.map((r, i) => {
                const pos = r.position ?? i + 1;
                const isLeader = pos === 1;
                return (
                  <TableRow key={`${group}-${r.team_name}-${i}`} className={isLeader ? "bg-accent/5" : undefined}>
                    <TableCell className="text-center font-mono text-xs">{pos}</TableCell>
                    <TableCell className="text-sm font-medium">{r.team_name}{isLeader && <Badge variant="outline" className="ml-2 text-[9px] border-accent text-accent">LEAD</Badge>}</TableCell>
                    <TableCell className="text-center tabular-nums text-xs">{r.played ?? 0}</TableCell>
                    <TableCell className="text-center tabular-nums text-xs">{r.won ?? 0}</TableCell>
                    <TableCell className="text-center tabular-nums text-xs">{r.drawn ?? 0}</TableCell>
                    <TableCell className="text-center tabular-nums text-xs">{r.lost ?? 0}</TableCell>
                    {!hideGoals && (
                      <>
                        <TableCell className="text-center tabular-nums text-xs">{r.goals_for ?? 0}</TableCell>
                        <TableCell className="text-center tabular-nums text-xs">{r.goals_against ?? 0}</TableCell>
                        <TableCell className="text-center tabular-nums text-xs">{r.goal_difference ?? 0}</TableCell>
                      </>
                    )}
                    <TableCell className="text-center tabular-nums font-bold">{r.points ?? 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
