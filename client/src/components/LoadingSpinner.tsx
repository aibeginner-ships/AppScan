import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center" data-testid="loading-spinner">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Analyzing reviews...</p>
      </div>
    </div>
  );
}
