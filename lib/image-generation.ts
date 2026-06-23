// Image generation via Replicate (FLUX model for fast, high-quality images)

export interface GeneratedImage {
  url: string;
  source: "replicate";
}

/**
 * Generate an image from a prompt using Replicate FLUX.
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY not configured");
  }

  const url = await generateViaReplicate(prompt);
  return { url, source: "replicate" };
}

/**
 * Generate image via Replicate using FLUX (fast, high quality)
 */
async function generateViaReplicate(prompt: string): Promise<string> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY not set");
  }

  // Use model endpoint format: POST to model-specific prediction endpoint
  const response = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-pro/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: "jpg",
          num_outputs: 1,
        },
      }),
    }
  );

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

