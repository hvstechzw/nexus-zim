import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHasRole } from "@/hooks/useHasRole";
import { useToast } from "@/hooks/use-toast";
import { NexusHeader } from "@/components/NexusHeader";
import { NexusFooter } from "@/components/NexusFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseScholasticCard, buildVerifyCardBody } from "@/lib/scholasticCardScan";
import jsQR from "jsqr";


type Athlete = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  external_student_id: string | null;
  ss_school_id: string | null;
  school_name: string | null;
  photo_url: string | null;
  scholastic_card_verified: boolean | null;
  nexus_sport: string | null;
};

export default function PlayerVerifyPage() {
  const { user } = useAuth();
  const { loading, hasRole, isAdmin } = useHasRole();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [cardData, setCardData] = useState<string>("");


  async function lookup(idOrQr: string, isQr = false) {
    const raw = (idOrQr || "").trim();
    if (!raw) return;
    setLookupBusy(true);
    setAthlete(null);
    setCardData(raw);

    let body: Record<string, unknown> | null;
    if (isQr) {
      const parsed = parseScholasticCard(raw);
      body = buildVerifyCardBody(parsed);
      if (!body) {
        setLookupBusy(false);
        toast({ title: "Unrecognized QR", description: "Scan didn't match any Scholastic Card format.", variant: "destructive" });
        return;
      }
    } else {
      body = { student_id: raw };
    }

    const { data, error } = await supabase.functions.invoke("verify-card", { body });
    setLookupBusy(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      return;
    }
    if (!data?.ok) {
      toast({ title: data?.status === "not_found" ? "Student not found" : `Card ${data?.status || "invalid"}`,
              description: data?.error || "Scholastic Services rejected this card.", variant: "destructive" });
      return;
    }
    if (data.athlete) setAthlete(data.athlete as Athlete);
    else {
      const s = data.student || {};
      setAthlete({
        id: s.uuid || "",
        external_student_id: s.student_id,
        display_name: s.name,
        first_name: (s.name || "").split(" ")[0] || null,
        last_name: (s.name || "").split(" ").slice(1).join(" ") || null,
        ss_school_id: s.school_id || null,
        school_name: null,
        photo_url: s.photo_url || null,
        scholastic_card_verified: true,
        nexus_sport: null,
      } as Athlete);
    }
    toast({ title: "Card verified", description: `${data.student?.name || "Student"} — ${data.status}` });
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
      const AnyWindow = window as any;
      const nativeDetector = "BarcodeDetector" in AnyWindow ? new AnyWindow.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      scanningRef.current = true;
      setScanning(true);

      const onHit = async (raw: string) => {
        stopCamera();
        setStudentIdInput(raw);
        await lookup(raw, true);
      };

      const loop = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        const v = videoRef.current;
        if (v.readyState >= 2 && v.videoWidth > 0) {
          try {
            if (nativeDetector) {
              const codes = await nativeDetector.detect(v);
              if (codes?.length) return onHit(String(codes[0].rawValue || ""));
            } else if (ctx) {
              canvas.width = v.videoWidth;
              canvas.height = v.videoHeight;
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
              if (code?.data) return onHit(code.data);
            }
          } catch (e) { console.warn("detect err", e); }
        }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e: any) {
      toast({ title: "Camera blocked", description: e.message, variant: "destructive" });
    }
  }


  function stopCamera() {
    scanningRef.current = false;
    setScanning(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => () => stopCamera(), []);

  if (loading) return <div className="p-12 text-center text-nexus-muted">Loading…</div>;
  if (!isAdmin && !hasRole("hic")) return <Navigate to="/dashboard" replace />;


  async function verify(method: "scholastic_card" | "manual_confirm") {
    if (!athlete) return;
    setVerifyBusy(true);
    const { error: insErr } = await supabase.from("scholastic_card_verifications").insert({
      ss_student_id: athlete.external_student_id || "",
      athlete_id: athlete.id,
      verified_by: user?.id ?? null,
      verification_method: method,
      card_scan_data: method === "scholastic_card" ? cardData : null,
      status: "verified",
    });
    if (insErr) { setVerifyBusy(false); toast({ title: "Verify failed", description: insErr.message, variant: "destructive" }); return; }
    const { error: updErr } = await supabase
      .from("athletes")
      .update({ scholastic_card_verified: true } as any)
      .eq("id", athlete.id);
    if (updErr) console.warn("athlete update", updErr.message);

    // Push verification back to SS (best-effort)
    supabase.functions.invoke("scholastic-push", {
      body: { athleteId: athlete.id, external_student_id: athlete.external_student_id, event: "card_verified" },
    }).catch(e => console.warn("ss push failed", e));

    setVerifyBusy(false);
    toast({ title: "Verified", description: `${athlete.display_name} marked as verified.` });
    setAthlete({ ...athlete, scholastic_card_verified: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NexusHeader />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-3xl w-full mx-auto">
        <div className="mb-6 text-xs mono text-nexus-muted">
          <Link to="/admin" className="hover:text-foreground">← Admin</Link>
        </div>
        <header className="mb-6">
          <p className="text-[10px] mono tracking-widest uppercase text-nexus-muted">HIC · Player Verification</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Verify Scholastic Card</h1>
          <p className="text-sm text-nexus-muted mt-1">Scan the QR on the athlete's Scholastic Card, or enter the SS Student ID manually.</p>
        </header>

        <section className="hairline rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">1. Scan or enter ID</h2>
          <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-3">
            <Input value={studentIdInput} onChange={e => setStudentIdInput(e.target.value)} placeholder="SS Student ID" />
            <Button onClick={() => lookup(studentIdInput)} disabled={lookupBusy || !studentIdInput.trim()}>
              {lookupBusy ? "Looking…" : "Look up"}
            </Button>
          </div>
          {!scanning ? (
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={startCamera}>Live camera scan</Button>
              <label className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md hairline cursor-pointer hover:bg-nexus-surface btn-click">
                Use device camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    try {
                      const bmp = await createImageBitmap(file);
                      const canvas = document.createElement("canvas");
                      canvas.width = bmp.width; canvas.height = bmp.height;
                      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
                      ctx.drawImage(bmp, 0, 0);
                      const AnyWindow = window as any;
                      let raw: string | null = null;
                      if ("BarcodeDetector" in AnyWindow) {
                        try {
                          const det = new AnyWindow.BarcodeDetector({ formats: ["qr_code"] });
                          const codes = await det.detect(canvas);
                          if (codes?.length) raw = String(codes[0].rawValue || "");
                        } catch {}
                      }
                      if (!raw) {
                        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(img.data, img.width, img.height);
                        raw = code?.data || null;
                      }
                      if (!raw) {
                        toast({ title: "No QR detected", description: "Try again with a clearer shot.", variant: "destructive" });
                        return;
                      }
                      setStudentIdInput(raw);
                      await lookup(raw, true);
                    } catch (err: any) {
                      toast({ title: "Could not read image", description: err.message, variant: "destructive" });
                    }
                  }}
                />
              </label>
              <span className="text-[10px] text-nexus-muted">Live = continuous webcam · Device = opens your phone's camera app</span>
            </div>
          ) : (
            <div className="space-y-2">
              <video ref={videoRef} className="w-full max-w-sm rounded-lg hairline" muted playsInline />
              <Button variant="ghost" size="sm" onClick={stopCamera}>Stop camera</Button>
            </div>
          )}
        </section>

        {athlete && (
          <section className="hairline rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">2. Confirm identity</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-nexus-surface flex items-center justify-center">
                {athlete.photo_url ? <img src={athlete.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl text-nexus-muted">{(athlete.first_name?.[0] || "?")}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold">{athlete.display_name}</p>
                <p className="text-xs text-nexus-muted">{athlete.school_name || "—"}</p>
                <p className="text-[10px] mono text-nexus-muted">SS ID: {athlete.external_student_id}</p>
                <div className="flex gap-1 mt-1">
                  {athlete.nexus_sport && <span className="pill-sport" data-sport={athlete.nexus_sport}>{athlete.nexus_sport}</span>}
                  {athlete.scholastic_card_verified && <span className="text-[9px] mono uppercase bg-nexus-live/10 text-nexus-live px-2 py-0.5 rounded">verified</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => verify("scholastic_card")} disabled={verifyBusy || athlete.scholastic_card_verified === true}>
                {verifyBusy ? "Saving…" : "Verify (card scan)"}
              </Button>
              <Button variant="outline" onClick={() => verify("manual_confirm")} disabled={verifyBusy || athlete.scholastic_card_verified === true}>
                Manual confirm
              </Button>
              <Button variant="ghost" onClick={() => { setAthlete(null); setStudentIdInput(""); setCardData(""); }}>Clear</Button>
            </div>
          </section>
        )}
      </main>
      <NexusFooter />
    </div>
  );
}
