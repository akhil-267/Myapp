
"use client";

import * as React from "react";
import type { IdentifyMedicineOutput } from "@/ai/flows/identify-medicine";
// Removed synthesizeSpeech server action as we are using browser's Web Speech API
// import { synthesizeSpeech } from "@/app/actions/synthesizeSpeech"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon, AlertTriangleIcon, CheckCircle2Icon, FileTextIcon, Volume2Icon, VolumeXIcon } from "lucide-react"; // Loader2 removed as isSynthesizing is removed
import { useToast } from "@/hooks/use-toast";

interface MedicineResultDisplayProps {
  data: IdentifyMedicineOutput | null;
  isLoading: boolean;
  error: string | null;
  language: string;
}

export function MedicineResultDisplay({ data, isLoading, error, language }: MedicineResultDisplayProps) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [availableVoices, setAvailableVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const { toast } = useToast();
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  React.useEffect(() => {
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    if (!('speechSynthesis' in window)) {
      toast({
        variant: "destructive",
        title: "Speech Unsupported",
        description: "Your browser does not support text-to-speech.",
      });
      return;
    }

    // Voices might be loaded already or will be loaded asynchronously.
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Cleanup function
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      // Cancel any ongoing speech if the component unmounts
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
    };
  }, [toast]);

  React.useEffect(() => {
    // Reset speaking state and cancel any ongoing speech if data or language changes
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel(); // This will trigger onend or onerror for the current utterance
    }
    // The onend/onerror handlers should set isSpeaking to false.
    // Setting it here directly might be premature if cancel is async.
    // However, it's a good fallback if events don't fire as expected.
    setIsSpeaking(false); 
  }, [data, language]);


  const handleSpeakUses = () => {
    if (!data?.uses) {
      toast({
        variant: "destructive",
        title: "Speech Error",
        description: "No text available to speak.",
      });
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast({ variant: "destructive", title: "Speech Error", description: "Your browser does not support text-to-speech." });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Stops speech. This should trigger onend or onerror.
      // `isSpeaking` will be set to false by the `onend` or `onerror` handler of the utterance.
      return;
    }

    // setIsSpeaking(true); // Set true when speech actually starts (in onstart)

    const utterance = new SpeechSynthesisUtterance(data.uses);
    utteranceRef.current = utterance; // Store reference for cleanup

    utterance.lang = language; 
    utterance.rate = 0.9; 
    utterance.pitch = 1;

    let targetVoice = availableVoices.find(voice => voice.lang === `${language}-IN` || voice.lang.startsWith(`${language}-`));
    if (!targetVoice) {
      targetVoice = availableVoices.find(voice => voice.lang === language);
    }
    
    if (targetVoice) {
      utterance.voice = targetVoice;
    } else {
      if (availableVoices.length > 0) {
         console.warn(`No specific voice found for lang '${language}'. Using browser default.`);
         toast({
            title: "Voice Information",
            description: `A specific voice for the selected language was not found on your system. Attempting to use the browser's default voice. Quality may vary.`,
            variant: "default",
          });
      } else {
        console.warn(`Voices not yet loaded or none available. Attempting speech with lang attribute '${language}'.`);
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      // "interrupted" or "canceled" can happen if speechSynthesis.cancel() is called,
      // or if another speech request starts. These are not "errors" in the sense
      // that something went wrong with the TTS engine itself.
      if (event.error === 'interrupted' || event.error === 'canceled') {
        console.info(`Speech synthesis event: ${event.error}. This is often expected during stop/navigation.`);
      } else {
        console.error("Speech synthesis error:", event.error, event);
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: `An error occurred during speech: ${event.error || 'Unknown speech error.'}`,
        });
      }
      setIsSpeaking(false); // Ensure state is reset regardless of error type
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-lg">
        <AlertTriangleIcon className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (data) {
    return (
      <Card className="shadow-lg border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <CheckCircle2Icon className="h-7 w-7" />
            Medicine Identified
          </CardTitle>
          <CardDescription className="text-lg pt-1">
            {data.medicineName || "Name not available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-foreground">
            <FileTextIcon className="h-5 w-5" />
            Uses:
          </h3>
          <p className="text-foreground/90 whitespace-pre-line">
            {data.uses || "Uses not available."}
          </p>
          {data.uses && ('speechSynthesis' in window) && (
            <Button 
              onClick={handleSpeakUses} 
              variant="outline" 
              className="mt-4 flex items-center" 
              aria-label={isSpeaking ? "Stop speaking medicine uses" : "Speak medicine uses"} 
              disabled={!data.uses}
            >
              {isSpeaking ? (
                <>
                  <VolumeXIcon className="mr-2 h-4 w-4" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Volume2Icon className="mr-2 h-4 w-4" />
                  Speak Uses
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-secondary/50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center text-secondary-foreground h-full p-6 rounded-md">
          <InfoIcon className="h-12 w-12 mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Get Started</h3>
          <p className="text-sm ">
            Upload an image of a tablet sheet and select your preferred language.
            Click &quot;Identify Medicine&quot; to see its name and uses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

