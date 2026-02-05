/**
 * EXIF Metadata Extraction Utility
 * Extracts camera, location, and image metadata from photos
 */

export interface ExifData {
  camera?: {
    make?: string;
    model?: string;
  };
  exposure?: {
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  datetime?: {
    dateTime?: string;
    dateTimeOriginal?: string;
  };
  image?: {
    width?: number;
    height?: number;
    orientation?: number;
  };
  raw?: Record<string, unknown>;
}

/**
 * Extract EXIF data from image file
 * Uses piexifjs library for EXIF parsing
 */
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const exifData = parseExifFromArrayBuffer(arrayBuffer);
        resolve(exifData);
      } catch (error) {
        // If EXIF parsing fails, return empty data
        resolve({});
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse EXIF data from ArrayBuffer
 * Simplified EXIF parser for common fields
 */
function parseExifFromArrayBuffer(arrayBuffer: ArrayBuffer): ExifData {
  const view = new Uint8Array(arrayBuffer);
  const exifData: ExifData = { raw: {} };

  // Check for JPEG SOI marker (FFD8)
  if (view[0] !== 0xff || view[1] !== 0xd8) {
    return exifData;
  }

  let offset = 2;

  while (offset < view.length) {
    // Find marker
    if (view[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = view[offset + 1];
    offset += 2;

    // APP1 marker (FFE1) contains EXIF data
    if (marker === 0xe1) {
      const length = (view[offset] << 8) | view[offset + 1];
      offset += 2;

      // Check for EXIF identifier
      const exifBytes = [];
      for (let i = 0; i < 4; i++) {
        exifBytes.push(view[offset + i]);
      }
      const exifIdentifier = String.fromCharCode(...exifBytes);
      if (exifIdentifier === 'Exif') {
        offset += 6; // Skip "Exif\0\0"

        // Parse TIFF header
        const littleEndian = view[offset] === 0x49;
        offset += 8; // Skip TIFF header

        // Parse IFD0
        const ifdOffset = offset;
        const exif = parseIFD(view, ifdOffset, littleEndian);

        return {
          camera: {
            make: exif.make as string | undefined,
            model: exif.model as string | undefined,
          },
          exposure: {
            iso: exif.iso as number | undefined,
            aperture: exif.aperture as string | undefined,
            shutterSpeed: exif.shutterSpeed as string | undefined,
            focalLength: exif.focalLength as string | undefined,
          },
          location: {
            latitude: exif.latitude as number | undefined,
            longitude: exif.longitude as number | undefined,
            altitude: exif.altitude as number | undefined,
          },
          datetime: {
            dateTime: exif.dateTime as string | undefined,
            dateTimeOriginal: exif.dateTimeOriginal as string | undefined,
          },
          image: {
            width: exif.imageWidth as number | undefined,
            height: exif.imageHeight as number | undefined,
            orientation: exif.orientation as number | undefined,
          },
          raw: exif,
        };
      }

      offset += length - 2;
    } else if (marker === 0xd9) {
      // EOI marker
      break;
    } else {
      // Skip other markers
      const length = (view[offset] << 8) | view[offset + 1];
      offset += length;
    }
  }

  return exifData;
}

/**
 * Parse IFD (Image File Directory) from EXIF data
 */
function parseIFD(
  view: Uint8Array,
  offset: number,
  littleEndian: boolean
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const readUint16 = (o: number) => {
    if (littleEndian) {
      return (view[o + 1] << 8) | view[o];
    }
    return (view[o] << 8) | view[o + 1];
  };

  const readUint32 = (o: number) => {
    if (littleEndian) {
      return (view[o + 3] << 24) | (view[o + 2] << 16) | (view[o + 1] << 8) | view[o];
    }
    return (view[o] << 24) | (view[o + 1] << 16) | (view[o + 2] << 8) | view[o + 3];
  };

  const entryCount = readUint16(offset);
  offset += 2;

  for (let i = 0; i < entryCount; i++) {
    const tag = readUint16(offset);
    const type = readUint16(offset + 2);
    const count = readUint32(offset + 4);
    const valueOffset = offset + 8;

    let value: unknown = null;

    // Common EXIF tags
    switch (tag) {
      case 0x010f: // Make
        value = readString(view, valueOffset, count);
        result.make = value;
        break;
      case 0x0110: // Model
        value = readString(view, valueOffset, count);
        result.model = value;
        break;
      case 0x0112: // Orientation
        value = readUint16(valueOffset);
        result.orientation = value;
        break;
      case 0x8827: // ISO
        value = readUint16(valueOffset);
        result.iso = value;
        break;
      case 0x9003: // DateTimeOriginal
        value = readString(view, valueOffset, count);
        result.dateTimeOriginal = value;
        break;
      case 0x0132: // DateTime
        value = readString(view, valueOffset, count);
        result.dateTime = value;
        break;
      case 0x010a: // ImageWidth
        value = readUint32(valueOffset);
        result.imageWidth = value;
        break;
      case 0x0103: // ImageHeight
        value = readUint32(valueOffset);
        result.imageHeight = value;
        break;
    }

    offset += 12;
  }

  return result;
}

/**
 * Read string from EXIF data
 */
function readString(view: Uint8Array, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length - 1; i++) {
    const char = view[offset + i];
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str;
}

/**
 * Format EXIF data for display
 */
export function formatExifData(exif: ExifData): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (exif.camera?.make) formatted['Camera Make'] = exif.camera.make;
  if (exif.camera?.model) formatted['Camera Model'] = exif.camera.model;
  if (exif.exposure?.iso) formatted['ISO'] = exif.exposure.iso.toString();
  if (exif.exposure?.aperture) formatted['Aperture'] = exif.exposure.aperture;
  if (exif.exposure?.shutterSpeed) formatted['Shutter Speed'] = exif.exposure.shutterSpeed;
  if (exif.exposure?.focalLength) formatted['Focal Length'] = exif.exposure.focalLength;
  if (exif.datetime?.dateTimeOriginal) formatted['Date/Time'] = exif.datetime.dateTimeOriginal;
  if (exif.image?.width && exif.image?.height) {
    formatted['Resolution'] = `${exif.image.width}x${exif.image.height}`;
  }
  if (exif.location?.latitude && exif.location?.longitude) {
    formatted['Location'] = `${exif.location.latitude.toFixed(6)}, ${exif.location.longitude.toFixed(6)}`;
  }

  return formatted;
}
