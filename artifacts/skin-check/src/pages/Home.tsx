import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useDiagnose } from "@workspace/api-client-react";
import { BodyDoll, SkinCondition, ZoneData } from "@/components/BodyDoll";
import { Button } from "@/components/ui/button";
import { useDiagnosisContext } from "@/context/DiagnosisContext";
import { RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CONDITIONS: SkinCondition[] = [
  "Acne", "Rash", "Eczema", "Infection", "Dryness", "Sunburn"
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentCondition, setCurrentCondition] = useState<SkinCondition>("Acne");
  const [zones, setZones] = useState<Map<string, ZoneData>>(new Map());
  const { setLastDiagnosis } = useDiagnosisContext();
  const diagnoseMutation = useDiagnose();

  const handleZoneInteract = (region: string, amount: number = 2) => {
    setZones((prev) => {
      const next = new Map(prev);
      const existing = next.get(region);
      
      let newSeverity = amount;
      if (existing) {
        if (existing.condition === currentCondition) {
          newSeverity = Math.min(existing.severity + amount, 10);
        } else {
          newSeverity = amount; // Reset severity if condition changes
        }
      }
      
      next.set(region, { condition: currentCondition, severity: newSeverity });
      return next;
    });
  };

  const handleDiagnose = () => {
    const affectedAreas = Array.from(zones.entries()).map(([region, data]) => ({
      region,
      condition: data.condition.toLowerCase(),
      severity: data.severity,
    }));

    if (affectedAreas.length === 0) return;

    diagnoseMutation.mutate(
      { data: { affectedAreas, age: null, additionalNotes: null } },
      {
        onSuccess: (result) => {
          setLastDiagnosis(result);
          setLocation("/diagnosis");
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col pt-8 pb-20 px-4">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        
        <header className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            SkinCheck
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2 text-sm"
          >
            Tap or hold areas to mark skin concerns
          </motion.p>
        </header>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CONDITIONS.map((cond) => (
            <button
              key={cond}
              onClick={() => setCurrentCondition(cond)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                currentCondition === cond
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white text-muted-foreground shadow-sm border border-border hover:bg-gray-50"
              )}
            >
              {cond}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center mb-8 relative">
          <BodyDoll 
            zones={zones} 
            currentCondition={currentCondition}
            onZoneInteract={(id) => handleZoneInteract(id, 2)}
            onZoneInteractHold={(id) => handleZoneInteract(id, 1)}
          />

          <Button
            variant="outline"
            size="icon"
            className="absolute top-0 right-0 rounded-full shadow-sm bg-white"
            onClick={() => setZones(new Map())}
            title="Reset"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="mt-auto pt-4">
          <Button 
            className="w-full h-14 rounded-2xl text-lg shadow-md font-semibold"
            disabled={zones.size === 0 || diagnoseMutation.isPending}
            onClick={handleDiagnose}
          >
            {diagnoseMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" /> Analyzing...
              </span>
            ) : (
              "Get AI Assessment"
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
