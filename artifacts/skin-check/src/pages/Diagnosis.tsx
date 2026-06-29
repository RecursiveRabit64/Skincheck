import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { useChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, AlertTriangle, Info, CheckCircle2, HeartPulse,
  ChevronLeft, ChevronRight, Send, Printer, Bot, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { simulateSeverity } from "@/lib/simulation";
import type { Recommendation, DiagnosisResultConditionsItem } from "@workspace/api-client-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function severityLabel(s: number): string {
  if (s <= 0) return "Resolved";
  if (s <= 2) return "Mild";
  if (s <= 4) return "Moderate";
  if (s <= 6) return "Significant";
  if (s <= 8) return "Severe";
  return "Critical";
}

function severityColor(s: number): string {
  if (s <= 0) return "text-green-600";
  if (s <= 3) return "text-yellow-600";
  if (s <= 6) return "text-orange-600";
  return "text-red-600";
}

function capitalize(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Diagnosis() {
  const [, setLocation] = useLocation();
  const { lastDiagnosis, sessionAreas } = useDiagnosisContext();
  const [simulatedDay, setSimulatedDay] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatMutation = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const simulatedAreas = useMemo(() =>
    sessionAreas.map((a) => ({
      ...a,
      simSeverity: simulateSeverity(a, simulatedDay),
    })),
    [sessionAreas, simulatedDay]
  );

  const diagnosisContextStr = useMemo(() => {
    if (!lastDiagnosis) return "";
    return [
      `Summary: ${lastDiagnosis.summary}`,
      `Conditions: ${lastDiagnosis.conditions.map((c) => `${c.name} (${c.likelihood})`).join(", ")}`,
      `Recommendations: ${lastDiagnosis.recommendations.map((r) => r.title).join(", ")}`,
    ].join("\n");
  }, [lastDiagnosis]);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || chatMutation.isPending) return;
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatInput("");

    chatMutation.mutate(
      { data: { messages: newMessages, diagnosisContext: diagnosisContextStr, affectedAreas: sessionAreas } },
      {
        onSuccess: (res) => {
          setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
        },
        onError: () => {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." },
          ]);
        },
      }
    );
  };

  const printReport = () => {
    if (!lastDiagnosis) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const reportDay = simulatedDay > 0 ? `Day ${simulatedDay} Projection` : "Day 0 — Current State";

    const areasRows = simulatedAreas.map((a) => `
      <tr>
        <td>${capitalize(a.region)}</td>
        <td>${a.condition}</td>
        <td>${Math.round(a.severity)}/10</td>
        <td>${simulatedDay > 0 ? `${Math.round(a.simSeverity)}/10` : "—"}</td>
        <td>${a.medication ?? "None"}</td>
      </tr>`).join("");

    const medsApplied = simulatedAreas.filter((a) => a.medication);
    const medRows = medsApplied.length > 0
      ? medsApplied.map((a) => `<tr><td>${capitalize(a.region)}</td><td>${a.condition}</td><td>${a.medication}</td></tr>`).join("")
      : `<tr><td colspan="3" style="color:#888;">No medications recorded</td></tr>`;

    const conditionRows = lastDiagnosis.conditions.map((c) => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.likelihood.replace("_", " ").toUpperCase()}</td>
        <td>${c.description}</td>
      </tr>`).join("");

    const recRows = lastDiagnosis.recommendations.map((r) => `
      <tr>
        <td>${r.type.toUpperCase()}</td>
        <td><strong>${r.title}</strong></td>
        <td>${r.description}</td>
        <td>${r.urgency.toUpperCase()}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>SkinCheck Patient Intake — ${dateStr}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; margin: 1.8cm 2.2cm; line-height: 1.45; }
  h1 { font-size: 15pt; margin-bottom: 2px; }
  h2 { font-size: 11pt; margin-top: 18px; margin-bottom: 5px; border-bottom: 1.5px solid #333; padding-bottom: 2px; letter-spacing: 0.03em; }
  h3 { font-size: 10pt; margin: 10px 0 3px; color: #333; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6px 0 12px; }
  th { background: #eee; border: 1px solid #bbb; padding: 5px 7px; text-align: left; font-size: 9pt; }
  td { border: 1px solid #ccc; padding: 4px 7px; vertical-align: top; }
  .header-block { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
  .meta { font-size: 8.5pt; color: #444; line-height: 1.6; }
  .alert { background: #fff3f3; border: 1px solid #e00; padding: 7px 10px; margin: 8px 0; border-radius: 3px; font-weight: bold; }
  .blank-row td { height: 26px; border-color: #ddd; }
  .section-note { font-size: 8pt; color: #777; font-style: italic; margin-bottom: 4px; }
  .disclaimer { font-size: 7.5pt; color: #666; border-top: 1px solid #bbb; margin-top: 22px; padding-top: 9px; line-height: 1.5; }
  .footer { font-size: 7.5pt; color: #999; text-align: center; margin-top: 24px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 10px; }
  .field label { display: block; font-size: 8.5pt; color: #555; margin-bottom: 2px; }
  .field .line { border-bottom: 1px solid #999; min-height: 20px; }
  @media print { body { margin: 1.2cm 1.8cm; } }
</style>
</head>
<body>

<div class="header-block">
  <h1>SkinCheck — Patient Self-Assessment Intake Form</h1>
  <p class="meta">
    <strong>Date of Assessment:</strong> ${dateStr} at ${timeStr} &nbsp;&nbsp;
    <strong>Assessment View:</strong> ${reportDay}<br>
    <strong>Tool:</strong> SkinCheck AI-Assisted Self-Assessment &nbsp;&nbsp;
    <strong>For All Ages</strong> &nbsp;&bull;&nbsp; Not a substitute for professional diagnosis
  </p>
</div>

${lastDiagnosis.seekDoctorUrgently ? `<div class="alert">AI assessment suggests seeking medical attention promptly.</div>` : ""}

<h2>Section 1 — Patient Demographics</h2>
<p class="section-note">To be completed by patient or guardian before appointment.</p>
<div class="two-col">
  <div>
    <div class="field"><label>Full Name</label><div class="line"></div></div>
    <div class="field"><label>Date of Birth</label><div class="line"></div></div>
    <div class="field"><label>Age</label><div class="line"></div></div>
  </div>
  <div>
    <div class="field"><label>Sex / Gender</label><div class="line"></div></div>
    <div class="field"><label>Parent / Guardian (if under 18)</label><div class="line"></div></div>
    <div class="field"><label>Date of Appointment</label><div class="line"></div></div>
  </div>
</div>

<h2>Section 2 — Medical & Allergy History</h2>
<div class="two-col">
  <div>
    <div class="field"><label>Known Drug Allergies</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Known Food / Contact Allergies</label><div class="line"></div></div>
    <div class="field"><label>Family History of Skin Conditions</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
  </div>
  <div>
    <div class="field"><label>Other Medical Conditions</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Current Oral Medications (all)</label><div class="line"></div><div class="line" style="margin-top:4px;"></div><div class="line" style="margin-top:4px;"></div></div>
  </div>
</div>

<h2>Section 3 — Symptom History</h2>
<div class="two-col">
  <div>
    <div class="field"><label>When did symptoms first appear?</label><div class="line"></div></div>
    <div class="field"><label>Have symptoms changed (better/worse)?</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Triggers noticed (stress, food, season, products)</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
  </div>
  <div>
    <div class="field"><label>Previous dermatologist visits for this?</label><div class="line"></div></div>
    <div class="field"><label>Prior treatments tried</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Itching / Pain / Other symptoms</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
  </div>
</div>

<h2>Section 4 — Self-Reported Skin Map</h2>
<p class="section-note">Recorded via SkinCheck interactive body map. Severity rated 1–10 by patient.</p>
<table>
  <tr>
    <th>Body Region</th>
    <th>Condition (Self-Reported)</th>
    <th>Severity Now</th>
    <th>${simulatedDay > 0 ? `Day ${simulatedDay} Estimate` : "Projected (Day)"}</th>
    <th>Topical Treatment Applied</th>
  </tr>
  ${areasRows}
</table>

<h2>Section 5 — Topical Treatments Currently Used</h2>
<p class="section-note">From app-recorded medications. Confirm with patient.</p>
<table>
  <tr><th>Region</th><th>Condition</th><th>Medication / Treatment</th></tr>
  ${medRows}
</table>
<div class="field" style="margin-top:8px;"><label>Additional topical products not listed above:</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>

<h2>Section 6 — AI Preliminary Assessment (For Context Only)</h2>
<p class="section-note">Generated by SkinCheck AI. Accuracy is not guaranteed. Credibility of AI simulation may vary by individual and should not replace clinical examination.</p>
<p style="margin-bottom:8px;">${lastDiagnosis.summary}</p>
<table>
  <tr><th>Possible Condition</th><th>AI Likelihood</th><th>AI Notes</th></tr>
  ${conditionRows}
</table>
<table>
  <tr><th>Category</th><th>Recommendation</th><th>Details</th><th>Urgency</th></tr>
  ${recRows}
</table>

<h2>Section 7 — Clinician Examination (To Be Completed by Doctor)</h2>
<p class="section-note">This section is for professional use only.</p>
<div class="two-col">
  <div>
    <div class="field"><label>Date Seen</label><div class="line"></div></div>
    <div class="field"><label>Clinician Name & Credentials</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Clinical Diagnosis (ICD-10)</label><div class="line"></div><div class="line" style="margin-top:4px;"></div></div>
  </div>
  <div>
    <div class="field"><label>Physical Examination Findings</label><div class="line"></div><div class="line" style="margin-top:4px;"></div><div class="line" style="margin-top:4px;"></div></div>
    <div class="field"><label>Distribution Pattern</label><div class="line"></div></div>
    <div class="field"><label>Morphology / Lesion Type</label><div class="line"></div></div>
  </div>
</div>
<div class="field"><label>Treatment Plan / Prescriptions</label><div class="line"></div><div class="line" style="margin-top:5px;"></div><div class="line" style="margin-top:5px;"></div></div>
<div class="two-col">
  <div class="field"><label>Labs / Tests Ordered</label><div class="line"></div></div>
  <div class="field"><label>Follow-up Date</label><div class="line"></div></div>
</div>
<div class="field"><label>Clinician Notes / Additional Observations</label><div class="line"></div><div class="line" style="margin-top:5px;"></div><div class="line" style="margin-top:5px;"></div><div class="line" style="margin-top:5px;"></div></div>

<div class="disclaimer">
  <strong>DISCLAIMER:</strong> ${lastDiagnosis.disclaimer} This form was generated by SkinCheck, an AI-assisted self-assessment tool intended to help patients of all ages communicate skin concerns to their healthcare provider. It is not a clinical diagnosis. All self-reported data and AI assessments are unverified and may not reflect the true medical situation. The day-based simulation uses approximations only and its accuracy varies by individual, condition, and adherence to treatment. All treatment decisions must be made by a licensed medical professional.
</div>
<div class="footer">SkinCheck &bull; Generated ${dateStr} &bull; For All Ages &bull; Use as a supplement to professional care</div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  if (!lastDiagnosis) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No assessment found.</p>
        <Button onClick={() => setLocation("/")}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background pb-20">

      {/* Sticky header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Your Assessment</h1>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs gap-1.5 px-3"
            onClick={printReport}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* Timeline Simulation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Progression Simulator
              </p>
              <span className="text-[10px] text-muted-foreground/70 italic">
                AI estimate — accuracy varies by individual
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 mt-2">
              <button
                onClick={() => setSimulatedDay((d) => Math.max(0, d - 1))}
                disabled={simulatedDay === 0}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={simulatedDay}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12 }}
                    className="text-center"
                  >
                    <p className="text-xl font-bold">
                      {simulatedDay === 0 ? "Today (Day 0)" : `Day ${simulatedDay}`}
                    </p>
                    {simulatedDay > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Simulated with {sessionAreas.some((a) => a.medication) ? "medication" : "no treatment applied"}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* All area bars */}
                {simulatedDay > 0 && simulatedAreas.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {simulatedAreas.map((a) => {
                      const base = a.severity;
                      const sim = a.simSeverity;
                      const pct = (sim / 10) * 100;
                      const improved = sim < base;
                      return (
                        <div key={a.region} className="flex items-center gap-2 text-xs">
                          <span className="w-28 truncate text-muted-foreground capitalize text-right shrink-0">
                            {a.region.replace(/_/g, " ")}
                          </span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", improved ? "bg-green-400" : "bg-red-400")}
                              initial={{ width: `${(base / 10) * 100}%` }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                          <span className={cn("w-10 text-right font-medium shrink-0", improved ? "text-green-600" : "text-red-600")}>
                            {Math.round(sim)}/10
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSimulatedDay((d) => Math.min(30, d + 1))}
                disabled={simulatedDay === 30}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Urgent warning */}
        {lastDiagnosis.seekDoctorUrgently && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">See a Doctor Soon</h3>
                <p className="text-sm opacity-90 mt-1">Based on your input, a dermatologist visit is recommended.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" /> Summary
          </h2>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
            <p className="text-foreground leading-relaxed">{lastDiagnosis.summary}</p>
          </Card>
        </motion.div>

        {/* Possible Conditions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold mb-3">Possible Conditions</h2>
          <div className="space-y-3">
            {lastDiagnosis.conditions.map((cond: DiagnosisResultConditionsItem, idx: number) => (
              <Card key={idx} className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base">{cond.name}</h3>
                  <Badge
                    variant={cond.likelihood === "very_likely" ? "default" : "secondary"}
                    className="rounded-full px-2 capitalize"
                  >
                    {cond.likelihood.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{cond.description}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-bold mb-3">Recommendations</h2>
          <div className="space-y-3">
            {lastDiagnosis.recommendations.map((rec: Recommendation, idx: number) => (
              <Card key={idx} className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {rec.urgency === "high"
                      ? <AlertTriangle className="w-5 h-5 text-destructive" />
                      : rec.urgency === "medium"
                      ? <Info className="w-5 h-5 text-orange-500" />
                      : <CheckCircle2 className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div>
                    <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">{rec.type}</h3>
                    <h4 className="font-semibold text-base mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Clinical Evaluation Sheet */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold mb-1">Clinical Evaluation Sheet</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Print this form and bring it to your dermatologist. For all ages.
          </p>
          <Card className="rounded-2xl bg-white shadow-sm border-border/50 overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Patient Intake Summary</p>
                <p className="text-xs text-muted-foreground">Self-reported skin history for doctor review</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={printReport}>
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
            </div>

            <div className="p-4 space-y-5 text-sm">
              {/* Skin map table */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Presenting Skin Concerns {simulatedDay > 0 ? `(Day ${simulatedDay} Projection)` : "(Current — Day 0)"}
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-semibold">Region</th>
                        <th className="text-left px-3 py-2 font-semibold">Condition</th>
                        <th className="text-left px-3 py-2 font-semibold">Severity</th>
                        <th className="text-left px-3 py-2 font-semibold">Treatment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulatedAreas.map((a, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="px-3 py-2 capitalize">{a.region.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2">{a.condition}</td>
                          <td className={cn("px-3 py-2 font-semibold", severityColor(a.simSeverity))}>
                            {Math.round(a.simSeverity)}/10 &mdash; {severityLabel(a.simSeverity)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{a.medication ?? "None"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Treatments in use */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Current Treatments
                </p>
                {simulatedAreas.some((a) => a.medication) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {simulatedAreas.filter((a) => a.medication).map((a, i) => (
                      <div key={i} className="bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-green-800">{a.medication}</span>
                        <span className="text-green-600 ml-1">({capitalize(a.region)})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No topical treatments recorded</p>
                )}
              </div>

              {/* AI differential */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  AI Differential (Context Only)
                </p>
                <div className="space-y-1.5">
                  {lastDiagnosis.conditions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge
                        variant={c.likelihood === "very_likely" ? "default" : "secondary"}
                        className="rounded-full text-[10px] shrink-0 mt-0.5"
                      >
                        {c.likelihood.replace("_", " ")}
                      </Badge>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blank clinician fields */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  For Clinician Completion
                </p>
                <div className="space-y-3">
                  {[
                    "Clinical Diagnosis",
                    "Physical Examination Findings",
                    "Treatment Plan / Prescriptions",
                    "Follow-up Date",
                    "Additional Notes",
                  ].map((label) => (
                    <div key={label} className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                      <div className="h-7 border-b border-dashed border-muted-foreground/30" />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/50">
                Simulation accuracy varies by individual and condition. This tool is intended as a supplement to — not a replacement for — professional medical evaluation. For all ages.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Chatbot */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Ask the AI
          </h2>
          <Card className="rounded-2xl bg-white shadow-sm border-border/50 overflow-hidden">
            <ScrollArea className="h-64 px-4 pt-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-8">
                  <Bot className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Ask anything about your skin assessment.</p>
                  <p className="text-xs opacity-70">e.g. "What triggers rosacea?" or "Is Dupixent right for me?"</p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        msg.role === "user" ? "bg-primary" : "bg-muted"
                      )}>
                        {msg.role === "user"
                          ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                          : <Bot className="w-3.5 h-3.5 text-foreground" />
                        }
                      </div>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-border/50 p-3 flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                className="rounded-xl border-border/60"
              />
              <Button
                size="icon"
                className="rounded-xl shrink-0"
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-xs text-muted-foreground/70 text-center px-4 leading-relaxed">
            {lastDiagnosis.disclaimer}
            {" "}SkinCheck is for all ages and is best used as a daily supplement to — not a replacement for — professional medical advice.
          </p>
        </motion.div>

        <div className="pt-2 pb-4">
          <Button className="w-full h-14 rounded-2xl text-lg font-semibold" variant="outline" onClick={() => setLocation("/")}>
            Start Over
          </Button>
        </div>
      </main>
    </div>
  );
}
