import type { FloorPlanImage } from '../../types/floorPlan'

export interface LoadedFloorPlan {
  readonly image: FloorPlanImage
  readonly element: HTMLImageElement
}

export type FloorPlanLoadResult =
  | { readonly ok: true; readonly floorPlan: LoadedFloorPlan }
  | { readonly ok: false; readonly message: string }

const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg'])
const ACCEPTED_EXTENSIONS = /\.(png|jpe?g)$/i

export const ACCEPTED_FILE_INPUT_TYPES = '.png,.jpg,.jpeg,image/png,image/jpeg'

/** Some systems report an empty MIME type, so fall back to the file extension. */
function isSupportedFile(file: File): boolean {
  return file.type ? ACCEPTED_MIME_TYPES.has(file.type) : ACCEPTED_EXTENSIONS.test(file.name)
}

export async function loadFloorPlanImage(file: File): Promise<FloorPlanLoadResult> {
  if (!isSupportedFile(file)) {
    return { ok: false, message: `"${file.name}" is not a supported file type. Please upload a PNG or JPG image.` }
  }

  const url = URL.createObjectURL(file)
  const element = new Image()
  element.src = url
  try {
    await element.decode()
  } catch {
    URL.revokeObjectURL(url)
    return { ok: false, message: `"${file.name}" could not be read as an image. The file may be damaged.` }
  }

  if (element.naturalWidth === 0 || element.naturalHeight === 0) {
    URL.revokeObjectURL(url)
    return { ok: false, message: `"${file.name}" has no visible pixels.` }
  }

  return {
    ok: true,
    floorPlan: {
      image: {
        fileName: file.name,
        url,
        size: { width: element.naturalWidth, height: element.naturalHeight },
      },
      element,
    },
  }
}
