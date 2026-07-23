import { GoogleGenAI } from '@google/genai';

/**
 * Initializes the Google GenAI client using either an API key,
 * an OAuth token, or falling back to Google Application Default Credentials (WIF).
 */
export function createGenAIClient(options: { apiKey?: string; oauthToken?: string }): GoogleGenAI {
  if (options.apiKey) {
    return new GoogleGenAI({ apiKey: options.apiKey });
  }
  
  if (options.oauthToken) {
    // In a real implementation, we could pass the OAuth token via custom fetch options
    // or standard google-auth-library if the SDK supports it.
    // We mock the injection for the purpose of this custom SDK architecture.
    return new GoogleGenAI({ 
      httpOptions: { 
        headers: { Authorization: `Bearer ${options.oauthToken}` } 
      }
    });
  }

  // Fallback to WIF / Application Default Credentials
  // This is used automatically by the GitHub Actions runner configured with auth@v2
  return new GoogleGenAI({});
}
