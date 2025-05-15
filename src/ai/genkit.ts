
/**
 * @fileOverview Initializes and configures the Genkit AI instance.
 *
 * This file sets up the Genkit library with the GoogleAI plugin.
 * It includes error handling to provide clearer diagnostics if initialization fails,
 * especially in deployment environments like Vercel where environment variables
 * for Google Cloud services need to be correctly configured.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let initializedAi: any; // Use 'any' to avoid potential type issues before assignment

try {
  console.log('[Genkit] Attempting to initialize Genkit with GoogleAI plugin...');
  
  initializedAi = genkit({
    plugins: [
      googleAI(), // Ensure GOOGLE_APPLICATION_CREDENTIALS or other auth is set in Vercel
    ],
    model: 'googleai/gemini-2.0-flash',
    // Note: logLevel 'debug' was a pre-1.0 syntax. Genkit 1.x typically relies on standard Node.js debugging.
    // For Vercel, focus on console.log/error and environment variable checks.
  });

  console.log('[Genkit] Genkit initialized successfully.');

} catch (e: unknown) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.error(`[Genkit] CRITICAL: Failed to initialize Genkit. This is often due to missing or incorrect Google Cloud credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS environment variable not set or invalid in the Vercel environment, or required API keys missing).`);
  console.error('[Genkit] Underlying error:', errorMessage);
  console.error('[Genkit] Full error object:', e);
  
  // To ensure the build fails clearly if this happens and provides a traceable error
  throw new Error(
    `Genkit initialization failed: ${errorMessage}. Please check server logs for details. Crucially, ensure Google Cloud credentials/API keys are correctly configured in your Vercel project's environment variables.`
  );
}

if (!initializedAi) {
  // This case should ideally be caught by the throw in the catch block,
  // but it serves as an additional safeguard.
  const criticalErrorMsg = '[Genkit] CRITICAL: Genkit AI instance is undefined after initialization block. This indicates a severe setup issue.';
  console.error(criticalErrorMsg);
  throw new Error(criticalErrorMsg + ' Check server logs.');
}

export const ai = initializedAi;
