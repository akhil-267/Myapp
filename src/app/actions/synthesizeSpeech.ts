
'use server';

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import type { protos } from '@google-cloud/text-to-speech';

interface SynthesizeSpeechError {
  error: string;
  message: string;
  details?: string;
}

// BCP-47 language codes mapping.
const languageCodeMap: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
  ja: 'ja-JP',
  ar: 'ar-XA', // Standard Arabic
  pt: 'pt-BR',
  ru: 'ru-RU',
  zh: 'cmn-CN', // Mandarin Chinese (Simplified)
  te: 'te-IN', // Telugu
};

// Voice name mapping (optional, can be extended)
// These are examples, you might want to choose specific voices.
// For Telugu, 'te-IN-Standard-A' (female) and 'te-IN-Standard-B' (male) are common.
const voiceNameMap: Record<string, string> = {
  'te-IN': 'te-IN-Standard-A', // Example Telugu voice
  'en-US': 'en-US-Standard-C', // Example English voice
  // Add other language-voice pairs as needed
};


let client: TextToSpeechClient | null = null;
try {
  client = new TextToSpeechClient();
} catch (error: unknown) {
  console.error("Failed to initialize TextToSpeechClient:", error);
  // Client remains null, synthesizeSpeech will handle this
}

export async function synthesizeSpeech(
  text: string,
  language: string
): Promise<string | SynthesizeSpeechError> {
  if (!client) {
    return {
      error: 'TTS Client Initialization Failed',
      message: 'The Text-to-Speech client could not be initialized. This usually means the Google Cloud credentials are not set up correctly or are inaccessible in this environment.',
      details: 'Ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set to your service account key file path, and the file is valid and readable by the application. Also, check server logs for more specific error messages during client initialization.',
    };
  }

  const targetLanguageCode = languageCodeMap[language.toLowerCase()] || language; // Fallback to direct language code if not in map
  const voiceName = voiceNameMap[targetLanguageCode] || undefined; // Select a specific voice if mapped, otherwise let API choose default

  const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
    input: { text: text },
    voice: {
      languageCode: targetLanguageCode,
      name: voiceName, // Use specific voice if available
      // ssmlGender: 'NEUTRAL', // Or 'MALE', 'FEMALE' - Alternatively, use specific voice names
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95, // Slightly slower for clarity
      pitch: 0,
    },
  };

  try {
    console.log(`Synthesizing speech for text: "${text.substring(0,30)}..." in language: ${targetLanguageCode} with voice: ${voiceName || 'default'}`);
    const [response] = await client.synthesizeSpeech(request);

    if (response.audioContent instanceof Uint8Array) {
      return Buffer.from(response.audioContent).toString('base64');
    } else if (typeof response.audioContent === 'string') {
      return response.audioContent; // Already base64 string
    }
    return {
      error: 'TTS Synthesis Error',
      message: 'Audio content received in an unexpected format.',
    };
  } catch (error: any) {
    console.error('ERROR:', error);
    let errorMessage = 'Failed to synthesize speech using Google Cloud Text-to-Speech API.';
    let errorDetails = error.message || 'Unknown error during API call.';
    
    // More specific error handling for common gRPC codes / auth issues
    if (error.code === 7 || error.message?.includes("PermissionDenied")) {
        errorMessage = "Permission Denied for Text-to-Speech API.";
        errorDetails = "The service account may not have the 'Cloud Text-to-Speech API User' role, or the API is not enabled in your Google Cloud project. Please check IAM permissions and API enablement status. Billing might also need to be enabled for the project.";
    } else if (error.code === 16 || error.message?.includes("Unauthenticated")) {
        errorMessage = "Authentication Failed for Text-to-Speech API.";
        errorDetails = "The request was not authenticated. This is likely due to missing or invalid credentials. Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly and points to a valid service account key file.";
    } else if (error.code === 2 && error.message?.includes("Could not refresh access token")) {
        errorMessage = "Authentication or API Configuration Error with Text-to-Speech API.";
        errorDetails = "The API call failed (GRPC Code 2), often due to issues refreshing an access token. Please verify your Google Cloud project configuration: 1. Ensure the Text-to-Speech API is enabled. 2. If using a service account, confirm the GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set to the path of your JSON key file, and the key file is valid and accessible. 3. Ensure the service account or API key has the necessary permissions (e.g., 'Cloud Text-to-Speech API User' role). 4. Check for any recent changes in your project's IAM policies or credentials, or billing status. Original error: " + error.message;
    } else if (error.code === 5 && error.message?.includes("not found")) {
        errorMessage = "Resource Not Found for Text-to-Speech API.";
        errorDetails = "A specified resource (e.g., custom voice) was not found. If you are not using custom voices, this might indicate an internal API issue or misconfiguration.";
    } else if (error.code === 3 && error.message?.includes("Invalid Value")) {
        errorMessage = "Invalid Input for Text-to-Speech API.";
        errorDetails = `The API received an invalid argument, such as an unsupported language code ('${targetLanguageCode}') or voice. Please check the input parameters. Original error: ${error.message}`;
    }


    return {
      error: 'Google TTS API Error',
      message: errorMessage,
      details: errorDetails,
    };
  }
}
