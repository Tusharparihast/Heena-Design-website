/** Read an image file and downscale it so localStorage stays small. */
export async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image."));
    el.src = raw;
  });
  const max = 720;
  const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Reads a QR code image without lossy re-encoding — JPEG artifacts can break scannability. */
export async function qrFileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load the image."));
    el.src = raw;
  });
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.imageSmoothingEnabled = false; // keep QR module edges crisp
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png"); // lossless
}

/**
 * Uploads a gallery photo to the private `gallery` bucket and returns a
 * long-lived signed link. Photos are downscaled first so the site stays fast.
 */
export async function uploadGalleryImage(file: File): Promise<string> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { signGalleryUpload } = await import("@/lib/gallery-uploads.functions");

  const dataUrl = await fileToDataUrl(file);
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("gallery")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  const { url } = await signGalleryUpload({ data: { path } });
  if (!url) throw new Error("Could not create a link for that photo.");
  return url;
}
