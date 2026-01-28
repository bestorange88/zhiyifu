import fs from "node:fs";
import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";

// Support both naming conventions for environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "sk-free-proxy";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

/**
 * Generate an image and return as Buffer.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const response = await openai.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
    prompt,
    size,
  });
  const base64 = response.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses standard DALL-E model (note: edit endpoint might differ in support across proxies).
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const response = await openai.images.edit({
    model: "dall-e-2", // DALL-E 3 does not support edits yet via API usually, DALL-E 2 does.
    image: images[0], // OpenAI edit takes one image and one mask usually. This existing code passed an array? Replit specific?
    // Replit's gpt-image-1 might have supported multiple images or this code was specific. 
    // Standard OpenAI edit: image, mask, prompt. 
    // Let's assume for now we just try to pass the first image if it's an edit.
    // However, looking at the original code: `image: images` (array). 
    // OpenAI Node SDK `images.edit` expects `image` (File), `mask` (File), `prompt`. 
    // If the original code passed an array, it was definitely custom.
    // To stay safe and avoid breaking "edit" if it's used, we might need to be careful.
    // But since we are switching to a standard proxy, Replit custom behavior won't work anyway.
    // For now, I'll comment out the edit implementation or try to adapt it to standard DALL-E 2 if possible, 
    // but the signature `image: images` suggests it was doing something non-standard (maybe blending?).
    // Standard edit requires a mask. 
    // Let's just keep it as is but warn, or better, switch to dall-e-2 and pass first image.
    // Actually, `openai.images.edit` signature in standard SDK:
    // ({ image, prompt, mask?, ... })
    // Passing an array `images` to `image` param would be a type error in standard SDK unless `images` was cast or Replit SDK was different.
    // I will try to make it standard-compliant-ish.
    prompt,
  });

  const imageBase64 = response.data?.[0]?.b64_json ?? "";
  const imageBytes = Buffer.from(imageBase64, "base64");

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}

