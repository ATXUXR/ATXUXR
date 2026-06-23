// Image generation via Hugging Face (Stable Diffusion)

export interface GeneratedImage {
  url: string;
  source: "huggingface";
}

/**
 * Generate an image from a prompt using Hugging Face Stable Diffusion.
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  const url = await generateViaHuggingFace(prompt);
  return { url, source: "huggingface" };
}

/**
 * Generate image via Hugging Face Inference API using Stable Diffusion
 */
async function generateViaHuggingFace(prompt: string): Promise<string> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY not set");
  }

  // Use Hugging Face Inference API for Stable Diffusion XL
  const modelId = "stabilityai/stable-diffusion-xl-base-1.0";

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt:
            "blurry, low quality, distorted, watermark, text, signature",
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Hugging Face API error: ${err.error || err.message || response.statusText}`
    );
  }

  // Hugging Face returns image as blob
  const blob = await response.blob();

  // Convert blob to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

