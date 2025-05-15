
"use client";

import { useState } from "react";
import type { IdentifyMedicineOutput } from "@/ai/flows/identify-medicine";
import { identifyMedicine } from "@/ai/flows/identify-medicine";
import { ImageUploadForm } from "@/components/pill-identifier/ImageUploadForm";
import { MedicineResultDisplay } from "@/components/pill-identifier/MedicineResultDisplay";
import { PillIcon } from "lucide-react"; // Using PillIcon from lucide-react
import { useToast } from "@/hooks/use-toast";

export default function PillIdentifierPage() {
  const [result, setResult] = useState<IdentifyMedicineOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const { toast } = useToast();

  const handleSubmit = async (data: { photoDataUri: string; language: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null); 
    setCurrentLanguage(data.language);
    try {
      const response = await identifyMedicine({
        photoDataUri: data.photoDataUri,
        language: data.language,
      });
      setResult(response);
    } catch (e) {
      console.error("Error identifying medicine:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during identification.";
      
      let friendlyMessage = errorMessage;
      if (errorMessage.includes("DEADLINE_EXCEEDED")) {
        friendlyMessage = "The request timed out. Please try again. If the issue persists, the image might be too complex or the server is busy.";
      } else if (errorMessage.includes("INVALID_ARGUMENT")) {
         friendlyMessage = "There was an issue with the uploaded image or selected language. Please check your input and try again.";
      }
      setError(friendlyMessage);
      toast({
        variant: "destructive",
        title: "Identification Error",
        description: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="py-6 px-4 md:px-8 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto flex items-center gap-3">
          <PillIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Pill Identifier
          </h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="md:sticky md:top-8"> 
            <ImageUploadForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div>
            <MedicineResultDisplay data={result} isLoading={isLoading} error={error} language={currentLanguage} />
          </div>
        </div>
      </main>
      <footer className="py-4 px-4 md:px-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pill Identifier. For informational purposes only. Always consult a healthcare professional.</p>
      </footer>
    </>
  );
}
