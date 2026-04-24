import { Navigate } from "@tanstack/react-router";
import { Brain, KeyRound, Layers, Sparkles, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";

const features = [
  {
    icon: Sparkles,
    label: "AI Summarization",
    desc: "3 depth levels: short, medium, detailed",
  },
  {
    icon: Layers,
    label: "Keyword Extraction",
    desc: "Auto-detect key concepts from your notes",
  },
  {
    icon: Zap,
    label: "Quiz Generation",
    desc: "MCQ questions for active recall revision",
  },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16 bg-background"
      data-ocid="login.page"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Brain
              className="w-7 h-7 text-primary-foreground"
              strokeWidth={2.5}
            />
          </div>
          <h1 className="text-display-md text-foreground">AI Notes Analyzer</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            Transform your raw notes into structured study material with
            AI-powered intelligence.
          </p>
        </div>

        {/* Login card */}
        <Card className="border-border shadow-card" data-ocid="login.dialog">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">
              Sign in to continue
            </CardTitle>
            <CardDescription className="text-sm">
              Use Internet Identity — secure, password-free authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full flex items-center gap-2"
              size="lg"
              onClick={login}
              disabled={isLoading}
              data-ocid="login.submit_button"
            >
              <KeyRound className="w-4 h-4" />
              {isLoading ? "Authenticating…" : "Sign in with Internet Identity"}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              No email or password required. Your identity is cryptographically
              secured.
            </p>
          </CardContent>
        </Card>

        {/* Feature hints */}
        <div className="space-y-2.5" data-ocid="login.features_list">
          {features.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className="flex items-start gap-3 px-4 py-3 rounded-lg bg-muted/60 border border-border"
              data-ocid={`login.feature.item.${i + 1}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-none mb-1">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
