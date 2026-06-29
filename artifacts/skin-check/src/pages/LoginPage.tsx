import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { HeartPulse, Shield, Users } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SkinCheck</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            AI-assisted skin concern tracker for the whole family.
            Track, simulate, and bring informed notes to your doctor.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-3"
        >
          <div className="flex flex-col gap-2.5 bg-muted/40 rounded-2xl p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span>One parent account, multiple child profiles</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>Each child profile is PIN-protected</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HeartPulse className="w-4 h-4 text-primary shrink-0" />
              <span>Designed for all ages — 5 through adult</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full"
        >
          <Button
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-md"
            onClick={login}
            disabled={isLoading}
          >
            Sign in to continue
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Sign in with your account to manage family profiles
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-[10px] text-muted-foreground/60 text-center max-w-xs leading-relaxed"
        >
          SkinCheck is for informational purposes only and does not replace professional medical advice.
        </motion.p>
      </div>
    </div>
  );
}
