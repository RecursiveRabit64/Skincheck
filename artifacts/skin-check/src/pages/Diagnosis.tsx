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
import type { Recommendation, DiagnosisResultConditionsItem } from "@workspace/api-client-react/src/generated/api.schemas";

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
      severity: simulateSeverity(a, simulatedDay),
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
      {
        data: {
          messages: newMessages,
          diagnosisContext: diagnosisContextStr,
          affectedAreas: sessionAreas,
        },
      },
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

    const areasRows = simulatedAreas.map((a) => `
      <tr>
        <td>${a.region.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
        <td>${a.condition.replace(/\b\w/g, (c) => c.toUpperCase())}</td>
        <td>${Math.round(a.severity)}/10</td>
        <td>${a.medication ?? "None"}</td>
      </tr>`).join("");

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
<title>SkinCheck Clinical Report — ${dateStr}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #111; margin: 2cm 2.5cm; line-height: 1.5; }
  h1 { font-size: 16pt; margin-bottom: 2px; }
  h2 { font-size: 13pt; margin-top: 20px; margin-bottom: 6px; border-bottom: 1px solid #666; padding-bottom: 3px; }
  h3 { font-size: 11pt; margin: 12px 0 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0; }
  th { background: #f0f0f0; border: 1px solid #aaa; padding: 6px 8px; text-align: left; font-size: 10pt; }
  td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: top; }
  .header-block { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
  .meta { font-size: 9pt; color: #555; }
  .alert { background: #fff3f3; border: 1px solid #e88; padding: 8px 12px; margin: 10px 0; border-radius: 4px; }
  .disclaimer { font-size: 8pt; color: #666; border-top: 1px solid #ccc; margin-top: 24px; padding-top: 10px; }
  .footer { font-size: 8pt; color: #888; text-align: center; margin-top: 30px; }
  @media print { body { margin: 1.5cm 2cm; } }
</style>
</head>
<body>
<div class="header-block">
  <h1>SkinCheck — Dermatology Self-Assessment Report</h1>
  <p class="meta">
    Report Date: ${dateStr} at ${timeStr}<br>
    Assessment Type: AI-Assisted Self-Report (Not a Clinical Diagnosis)<br>
    ${simulatedDay > 0 ? `<strong>Day ${simulatedDay} Projection Shown</strong><br>` : "Day 0 (Current State)<br>"}
    Generated by: SkinCheck Patient Self-Assessment Tool
  </p>
</div>

${lastDiagnosis.seekDoctorUrgently ? `<div class="alert"><strong>ALERT:</strong> AI assessment suggests seeking medical attention promptly.</div>` : ""}

<h2>1. Presenting Concerns (Patient Self-Report)</h2>
<p>The patient used an interactive body map to identify and rate the following areas of concern:</p>
<table>
  <tr>
    <th>Body Region</th>
    <th>Condition (Self-Reported)</th>
    <th>Severity (0–10)</th>
    <th>Current Treatment Applied</th>
  </tr>
  ${areasRows}
</table>

<h2>2. AI Differential Assessment</h2>
<p>${lastDiagnosis.summary}</p>
<table>
  <tr>
    <th>Possible Condition</th>
    <th>Likelihood</th>
    <th>Notes</th>
  </tr>
  ${conditionRows}
</table>

<h2>3. Recommended Actions</h2>
<table>
  <tr>
    <th>Category</th>
    <th>Recommendation</th>
    <th>Details</th>
    <th>Urgency</th>
  </tr>
  ${recRows}
</table>

<h2>4. Clinician Notes</h2>
<table>
  <tr>
    <th>Field</th>
    <th>Value</th>
  </tr>
  <tr><td>Date Seen</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
  <tr><td>Clinician Name</td><td>&nbsp;</td></tr>
  <tr><td>Physical Examination Findings</td><td>&nbsp;<br>&nbsp;<br>&nbsp;</td></tr>
  <tr><td>Clinical Diagnosis</td><td>&nbsp;<br>&nbsp;</td></tr>
  <tr><td>Treatment Plan</td><td>&nbsp;<br>&nbsp;<br>&nbsp;</td></tr>
  <tr><td>Follow-up</td><td>&nbsp;</td></tr>
</table>

<div class="disclaimer">
  <strong>DISCLAIMER:</strong> ${lastDiagnosis.disclaimer} This report was generated automatically by SkinCheck, an AI-assisted self-assessment tool, and is intended to support — not replace — professional medical evaluation. All findings are based on patient self-report and have not been clinically verified. No diagnosis or treatment decision should be made solely on the basis of this document.
</div>

<div class="footer">SkinCheck AI Self-Assessment &bull; Generated ${dateStr}</div>
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
            data-testid="button-print-report"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* Timeline Simulation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Progression Simulator
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSimulatedDay((d) => Math.max(0, d - 1))}
                disabled={simulatedDay === 0}
                data-testid="day-decrement"
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
                        Projected with {sessionAreas.some((a) => a.medication) ? "medication" : "no treatment"}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Severity mini-bars */}
                {simulatedDay > 0 && simulatedAreas.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {simulatedAreas.slice(0, 5).map((a) => {
                      const base = sessionAreas.find((s) => s.region === a.region)?.severity ?? a.severity;
                      const pct = (a.severity / 10) * 100;
                      const improved = a.severity < base;
                      return (
                        <div key={a.region} className="flex items-center gap-2 text-xs">
                          <span className="w-24 truncate text-muted-foreground capitalize">
                            {a.region.replace(/_/g, " ")}
                          </span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", improved ? "bg-green-400" : "bg-red-400")}
                              initial={{ width: `${(base / 10) * 100}%` }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className={cn("w-12 text-right font-medium", improved ? "text-green-600" : "text-red-600")}>
                            {Math.round(a.severity)}/10
                          </span>
                        </div>
                      );
                    })}
                    {simulatedAreas.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{simulatedAreas.length - 5} more areas
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSimulatedDay((d) => Math.min(30, d + 1))}
                disabled={simulatedDay === 30}
                data-testid="day-increment"
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" /> Summary
          </h2>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
            <p className="text-foreground leading-relaxed">{lastDiagnosis.summary}</p>
          </Card>
        </motion.div>

        {/* Conditions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold mb-3">Recommendations</h2>
          <div className="space-y-3">
            {lastDiagnosis.recommendations.map((rec: Recommendation, idx: number) => (
              <Card key={idx} className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {rec.urgency === "high" ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : rec.urgency === "medium" ? (
                      <Info className="w-5 h-5 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {rec.type}
                    </h3>
                    <h4 className="font-semibold text-base mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Clinical Report Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xl font-bold mb-3">Clinical Evaluation Sheet</h2>
          <Card className="rounded-2xl bg-white shadow-sm border-border/50 overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">For Doctor Review</p>
                <p className="text-xs text-muted-foreground">Present this at your dermatology appointment</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5 text-xs"
                onClick={printReport}
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {/* Affected areas table */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Presenting Concerns {simulatedDay > 0 ? `(Day ${simulatedDay} Projection)` : "(Current)"}
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
                          <td className="px-3 py-2 capitalize">{a.condition}</td>
                          <td className={cn("px-3 py-2 font-semibold", severityColor(a.severity))}>
                            {Math.round(a.severity)}/10 — {severityLabel(a.severity)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{a.medication ?? "None"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Differential diagnoses */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  AI Differential Assessment
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
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground ml-1.5">— {c.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinician notes lines */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Clinician Notes (to be completed by doctor)
                </p>
                <div className="space-y-2">
                  {["Clinical Diagnosis", "Examination Findings", "Treatment Plan", "Follow-up Date"].map((label) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <div className="h-7 border-b border-dashed border-muted-foreground/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chatbot */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Ask the AI
          </h2>
          <Card className="rounded-2xl bg-white shadow-sm border-border/50 overflow-hidden">
            <ScrollArea className="h-64 px-4 pt-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-8">
                  <Bot className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Ask me anything about your skin assessment.</p>
                  <p className="text-xs opacity-70">Try: "What causes cystic acne?" or "Is Differin safe for me?"</p>
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
                        <Bot className="w-3.5 h-3.5 text-foreground" />
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
                data-testid="chat-input"
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                className="rounded-xl border-border/60"
              />
              <Button
                data-testid="chat-send"
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <p className="text-xs text-muted-foreground/70 text-center px-4 leading-relaxed">
            {lastDiagnosis.disclaimer}
          </p>
        </motion.div>

        <div className="pt-4 pb-4">
          <Button
            className="w-full h-14 rounded-2xl text-lg font-semibold"
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Start Over
          </Button>
        </div>

      </main>
    </div>
  );
}
