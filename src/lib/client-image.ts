export async function optimizeProductImage(file: File): Promise<File> {
  if (file.size <= 1_500_000 && file.type === "image/webp") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ไม่สามารถประมวลผลรูปภาพได้");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob) throw new Error("ไม่สามารถย่อรูปภาพได้");
  const name = file.name.replace(/\.[^.]+$/, "") || "product";
  return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
}
