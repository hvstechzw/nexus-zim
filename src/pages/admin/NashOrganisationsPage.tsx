import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NashHeader } from "@/components/nash/NashHeader";
import { ChevronDown, ChevronRight, Building2, Globe2, MapPin, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { provinceCode } from "@/components/nash/ProvinceSelector";

interface Org {
  id: string; type: "nash" | "naph"; level: "national" | "provincial" | "district" | "zonal";
  name: string; province: string | null; district: string | null; zone: string | null;
  parent_id: string | null; chair_name: string | null; secretary_name: string | null;
  email: string | null; phone: string | null; is_active: boolean | null;
}

interface TreeNode extends Org { children: TreeNode[]; }

function buildTree(rows: Org[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

const LEVEL_ICON: Record<string, typeof Globe2> = {
  national: Globe2, provincial: MapPin, district: Network, zonal: Building2,
};

function OrgRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const Icon = LEVEL_ICON[node.level] || Building2;
  const hasChildren = node.children.length > 0;
  return (
    <>
      <div
        className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 px-3 py-2 rounded hover:bg-accent/5 cursor-pointer border-b border-border/30"
        style={{ paddingLeft: `${12 + depth * 18}px` }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        <span className="text-muted-foreground">
          {hasChildren ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="inline-block w-3.5" />}
        </span>
        <Icon className="h-4 w-4 text-accent" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{node.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {node.level.toUpperCase()}
            {node.province && <> · {node.province} <Badge variant="outline" className="ml-1 font-mono text-[9px]">{provinceCode(node.province)}</Badge></>}
            {node.chair_name && <> · Chair: {node.chair_name}</>}
          </div>
        </div>
        <Badge variant={node.type === "nash" ? "default" : "secondary"} className="text-[9px] font-display tracking-wider uppercase">{node.type}</Badge>
      </div>
      {open && node.children.map((c) => <OrgRow key={c.id} node={c} depth={depth + 1} />)}
    </>
  );
}

export default function NashOrganisationsPage() {
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("nash_organisations").select("*").order("level").order("name");
      setRows((data || []) as Org[]);
      setLoading(false);
    })();
  }, []);

  const tree = useMemo(() => buildTree(rows), [rows]);

  return (
    <div className="min-h-screen bg-background">
      <NashHeader />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-display tracking-[0.2em] uppercase text-accent">Federation · Organisations</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">NASH / NAPH Organisation Tree</h1>
          <p className="text-xs text-muted-foreground mt-0.5">National → Provincial → District → Zonal hierarchy across both federations.</p>
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-display tracking-wide">Hierarchy</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading && <p className="text-xs text-muted-foreground p-4">Loading…</p>}
            {!loading && tree.length === 0 && (
              <p className="text-sm text-muted-foreground p-6 text-center">No organisations yet. Seed migration creates NASH national + 10 provincial PSSAs.</p>
            )}
            {tree.map((n) => <OrgRow key={n.id} node={n} depth={0} />)}
          </CardContent>
        </Card>
        <p className="text-[10px] text-muted-foreground text-center pt-2">Powered by NASH · Built by Aetheris Innovative Enterprises</p>
      </div>
    </div>
  );
}
