import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border p-8 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h3 className="mt-4 text-lg font-medium" data-testid="text-error-message">{message}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Please check the URL and try again
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="mt-6"
            data-testid="button-retry"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
