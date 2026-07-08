
"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { useToast } from "@/hooks/use-toast";

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: Error) => {
      console.error(error); // This will show the rich error in the dev console overlay.

      // We can also show a toast, but for this case, the console error is more important.
      toast({
        variant: "destructive",
        title: "Firestore Permission Error",
        description: "Check the developer console for detailed security rule violation information.",
      });
    };

    errorEmitter.on("permission-error", handleError);

    return () => {
      errorEmitter.off("permission-error", handleError);
    };
  }, [toast]);

  return null;
}
