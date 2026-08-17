/**
 * Client-side image compressor utility.
 * Optimizes user-uploaded cover images before sending to Firebase Storage.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<File> {
  // If SVG or already under 150KB, keep as is
  if (file.type === "image/svg+xml" || file.size < 150 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        let { width, height } = img

        // Scale down proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          // Fallback if 2d context unavailable
          resolve(file)
          return
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to WebP Blob (fallback to JPEG)
        const mimeType = "image/webp"
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't reduce size, use original
              resolve(file)
              return
            }

            const optimizedName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
            const compressedFile = new File([blob], optimizedName, {
              type: mimeType,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          mimeType,
          quality,
        )
      }

      img.onerror = () => resolve(file)
    }

    reader.onerror = () => resolve(file)
  })
}
