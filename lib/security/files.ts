import "server-only";
import sharp from "sharp";

export type CleanImageFormat = "jpeg" | "png" | "webp";

export interface CleanFile {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

/** Larger than any real photo, small enough to stop "decompression bombs":
 * tiny files that expand to gigabytes of pixels and freeze the server. */
const MAX_PIXELS = 60_000_000;

/** Rebuilds an image from its pixels alone ("content disarm and
 * reconstruction"). Anything hidden in the file — script appended after the
 * image data, payloads in EXIF/XMP/comment blocks, a polyglot HTML header —
 * does not survive, because only decoded pixels are written back. EXIF is
 * dropped too, which also strips GPS location from phone photos.
 *
 * Returns null when the file isn't a decodable image. */
export async function rebuildImage(
  input: Blob,
  { format, maxSide }: { format: CleanImageFormat; maxSide: number },
): Promise<CleanFile | null> {
  try {
    let pipeline = sharp(Buffer.from(await input.arrayBuffer()), {
      limitInputPixels: MAX_PIXELS,
      failOn: "error",
      animated: false,
    })
      // Apply the camera's rotation before EXIF (which records it) is dropped.
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true });

    pipeline =
      format === "jpeg"
        ? pipeline.jpeg({ quality: 88, mozjpeg: true })
        : format === "png"
          ? pipeline.png({ compressionLevel: 9 })
          : pipeline.webp({ quality: 86 });

    const buffer = await pipeline.toBuffer();
    return { buffer, contentType: `image/${format}`, ext: format === "jpeg" ? "jpg" : format };
  } catch (error) {
    console.warn("[files] image rejected:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** PDF features that run actions or carry other files. A design reference
 * never needs them, so a PDF using any of them is refused outright. */
const PDF_ACTIVE_CONTENT = /\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA|RichMedia|XFA|SubmitForm|ImportData)\b/;

/** PDFs can't be rebuilt like images, so they're checked instead: real PDF
 * structure, no scripts/auto-actions/attachments. Compressed object streams
 * could still hide such keys, which is why PDFs are only ever opened in the
 * browser's sandboxed viewer from the admin, never stored on our domain. */
export async function checkPdf(input: Blob): Promise<CleanFile | null> {
  const buffer = Buffer.from(await input.arrayBuffer());
  const text = buffer.toString("latin1");
  if (!text.startsWith("%PDF-") || !text.includes("%%EOF")) return null;
  if (PDF_ACTIVE_CONTENT.test(text)) {
    console.warn("[files] PDF rejected: active content");
    return null;
  }
  return { buffer, contentType: "application/pdf", ext: "pdf" };
}
