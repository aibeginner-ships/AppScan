import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

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

    // Navigate to analysis page (will be implemented with actual API call)
    console.log("Analyzing:", url);
    // For prototype: would navigate to analysis page
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <h1 className="text-5xl font-bold">
              What does this app do?
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              Summarize any app's store reviews in seconds.
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
