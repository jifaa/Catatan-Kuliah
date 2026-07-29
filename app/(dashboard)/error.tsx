"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || "Sesuatu yang tidak terduga terjadi. Silakan coba lagi."}
          </p>
        </div>
        <Button onClick={reset} className="cursor-pointer">Coba Lagi</Button>
      </div>
    </div>
  );
}
