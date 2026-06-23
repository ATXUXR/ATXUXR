// Image generation via Google Gemini (included with your Google account)

export interface GeneratedImage {
  url: string;
  source: "google";
}

/**
 * Generate an image from a prompt using Google Gemini.
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const url = await generateViaGoogle(prompt);
  return { url, source: "google" };
}

/**
 * Generate image via Google Gemini API
 */
async function generateViaGoogle(prompt: string): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
  }

  // Use Google's image generation API
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Google Gemini API error: ${err.error?.message || err.error || response.statusText}`
    );
  }

  const data = await response.json();

  // Extract image URL from response
  if (
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0]
  ) {
    const imageData = data.candidates[0].content.parts[0];

    // If it's an inline_data object, we need to handle the base64
    if (imageData.inline_data && imageData.inline_data.data) {
      // For now, return the base64 as a data URL
      const base64 = imageData.inline_data.data;
      const mimeType = imageData.inline_data.mime_type || "image/jpeg";
      return `data:${mimeType};base64,${base64}`;
    }
  }

  throw new Error("No image data in Google Gemini response");
}

