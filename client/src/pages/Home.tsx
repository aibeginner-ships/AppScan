import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AnalysisResult } from "@shared/schema";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import Analysis from "./Analysis";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/analyze", { url });
      const data = await response.json();
      return data as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setError("");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to analyze app reviews. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate URL
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    const isGooglePlay = url.includes("play.google.com");
    const isAppStore = url.includes("apps.apple.com");

    if (!isGooglePlay && !isAppStore) {
      setError("Please enter a valid Google Play or Apple App Store URL");
      return;
    }

    analysisMutation.mutate(url);
  };

  const handleBack = () => {
    setAnalysisResult(null);
    setUrl("");
    setError("");
    analysisMutation.reset();
  };

  // Show loading state
  if (analysisMutation.isPending) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (analysisMutation.isError && !analysisResult) {
    return <ErrorState message={error} onRetry={handleBack} />;
  }

  // Show analysis results
  if (analysisResult) {
    return <Analysis data={analysisResult} onBack={handleBack} />;
  }

  // Show home page
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <h1 className="text-5xl font-bold">
              AppScan
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Get instant clarity on what users love and hate about your app
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter Google Play or Apple App Store URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-14 pl-12 text-lg"
                  data-testid="input-url"
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 px-8 text-base font-semibold"
                data-testid="button-analyze"
              >
                Analyze Reviews
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-left text-sm text-destructive" data-testid="text-error">
                {error}
              </p>
            )}
          </form>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>Supports both Google Play Store and Apple App Store</p>
          </div>
        </div>
      </div>
    </div>
  );
}
