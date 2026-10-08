import { join } from 'pathe'
import { withLeadingSlash } from 'ufo'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from './constants'

export function generateIdFromFsPath(fsPath: string) {
  return join(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath)
}

export interface MediaItemKeyFields {
  id: string
  extension: string
  stem: string
  path: string
  fsPath: string
  [key: string]: unknown
}

// `key` must be a raw, unprefixed storage key — strip VIRTUAL_MEDIA_COLLECTION_NAME first if present
export function mediaItemFieldsFromKey(key: string): MediaItemKeyFields {
  const fsPath = withLeadingSlash(key.replace(/:/g, '/'))
  return {
    id: generateIdFromFsPath(fsPath),
    extension: key.split('.').pop() || '',
    stem: fsPath.split('.').slice(0, -1).join('.'),
    path: fsPath,
    fsPath,
  }
}

// Decodes a base64 data URL into a typed Blob so it can be uploaded as raw bytes.
// Uses atob instead of fetch(dataUrl), which a site CSP may block (connect-src data:)
export function dataUrlToBlob(dataUrl: string): Blob | undefined {
  const match = dataUrl.match(/^data:([^;,]*)(?:;[^,]*)?;base64,/)
  if (!match) {
    return undefined
  }

  const binaryString = atob(dataUrl.slice(match[0].length))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new Blob([bytes], { type: match[1] || 'application/octet-stream' })
}

// `allowedTypes` entries are prefixes, with an optional trailing wildcard: 'video/*' matches 'video/mp4'
export function isMediaTypeAllowed(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => mimeType.startsWith(type.replace('*', '')))
}
