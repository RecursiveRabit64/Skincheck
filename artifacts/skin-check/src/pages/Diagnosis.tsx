import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Info, CheckCircle2, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recommendation, DiagnosisResultConditionsItem } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Diagnosis() {
  const [, setLocation] = useLocation();
  const { lastDiagnosis } = useDiagnosisContext();

  if (!lastDiagnosis) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No diagnosis found.</p>
        <Button onClick={() => setLocation("/")}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background pb-20">
      
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Your Assessment</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {lastDiagnosis.seekDoctorUrgently && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Seek Medical Attention</h3>
                <p className="text-sm opacity-90 mt-1">Based on your input, you should see a doctor or dermatologist as soon as possible.</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" /> Summary
          </h2>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
            <p className="text-foreground leading-relaxed">{lastDiagnosis.summary}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold mb-3">Possible Conditions</h2>
          <div className="space-y-3">
            {lastDiagnosis.conditions.map((cond: DiagnosisResultConditionsItem, idx: number) => (
              <Card key={idx} className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base">{cond.name}</h3>
                  <Badge variant={cond.likelihood === 'very_likely' ? 'default' : 'secondary'} className="rounded-full px-2">
                    {cond.likelihood.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{cond.description}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold mb-3">Recommendations</h2>
          <div className="space-y-3">
            {lastDiagnosis.recommendations.map((rec: Recommendation, idx: number) => (
              <Card key={idx} className="p-4 rounded-2xl bg-white shadow-sm border-border/50">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {rec.urgency === 'high' ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : rec.urgency === 'medium' ? (
                      <Info className="w-5 h-5 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground/90 uppercase tracking-wider mb-1">{rec.type}</h3>
                    <h4 className="font-semibold text-base mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-xs text-muted-foreground/70 text-center px-4 leading-relaxed">
            {lastDiagnosis.disclaimer}
          </p>
        </motion.div>

        <div className="pt-6">
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
