// Image generation via Replicate (primary) + Google Imagen (fallback)

export interface GeneratedImage {
  url: string;
  source: "replicate" | "imagen";
}

/**
 * Generate an image from a prompt.
 * Tries Replicate first (FLUX), falls back to Google Imagen if needed.
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  // Try Replicate first (faster, more reliable)
  if (process.env.REPLICATE_API_KEY) {
    try {
      console.log("Attempting image generation via Replicate...");
      const url = await generateViaReplicate(prompt);
      return { url, source: "replicate" };
    } catch (err) {
      console.warn("Replicate failed, trying Imagen:", err);
    }
  }

  // Fall back to Google Imagen
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    process.env.GOOGLE_CLOUD_PROJECT_ID
  ) {
    try {
      console.log("Attempting image generation via Google Imagen...");
      const url = await generateViaImagen(prompt);
      return { url, source: "imagen" };
    } catch (err) {
      console.warn("Imagen failed:", err);
    }
  }

  throw new Error(
    "Image generation failed with all services. Check API keys."
  );
}

/**
 * Generate image via Replicate using FLUX (fast, high quality)
 */
async function generateViaReplicate(prompt: string): Promise<string> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY not set");
  }

  // FLUX Pro model - fast and high quality
  const version = "bd264eaef2c50b63661ac4d29753975e56a8d57db68264e5dacbf4e5c64a26de";

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        prompt,
        aspect_ratio: "16:9",
        output_format: "jpg",
        safety_tolerance: 2,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Replicate API error: ${err.detail || err.error || response.statusText}`
    );
  }

  const prediction = await response.json();
  const predictionId = prediction.id;

  // Poll for completion (timeout after 3 minutes)
  const startTime = Date.now();
  const timeout = 3 * 60 * 1000;

  while (Date.now() - startTime < timeout) {
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );

    const status = await statusResponse.json();

    if (status.status === "succeeded") {
      const imageUrl = Array.isArray(status.output)
        ? status.output[0]
        : status.output;
      if (!imageUrl) {
        throw new Error("Replicate returned no image URL");
      }
      return imageUrl;
    }

    if (status.status === "failed") {
      throw new Error(`Replicate generation failed: ${status.error}`);
    }

    // Wait 1 second before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Replicate generation timed out (exceeded 3 minutes)");
}

/**
 * Generate image via Google Vertex AI Imagen
 * Requires GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CLOUD_PROJECT_ID in env
 */
async function generateViaImagen(prompt: string): Promise<string> {
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");
  }

  try {
    // Dynamic import to avoid dependency issues if not configured
    const aiplatform = await import("@google-cloud/aiplatform");
    const { v1beta1 } = aiplatform;
    const { ImageGenerationServiceClient } = v1beta1;

    const client = new ImageGenerationServiceClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    const request = {
      parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1`,
      instances: [
        {
          prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
      },
    };

    const [response] = await client.generateImages(request);

    if (!response.raiFilteredReasonsCount && response.images?.length > 0) {
      const imageData = response.images[0];
      // Imagen returns base64 or URL depending on configuration
      if (imageData.bytesBase64Encoded) {
        throw new Error(
          "Imagen returned base64 data; need to upload to storage first"
        );
      }
      if (imageData.imageUri) {
        return imageData.imageUri;
      }
    }

    throw new Error("Imagen returned no valid image");
  } catch (err) {
    // If library not installed, provide helpful error
    if (err instanceof Error && err.message.includes("Cannot find module")) {
      throw new Error(
        "Google AI Platform library not installed. Run: npm install @google-cloud/aiplatform"
      );
    }
    throw err;
  }
}
