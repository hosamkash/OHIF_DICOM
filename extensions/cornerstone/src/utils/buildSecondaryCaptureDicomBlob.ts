import dcmjs from 'dcmjs';

const SECONDARY_CAPTURE_SOP_CLASS = '1.2.840.10008.5.1.4.1.1.7';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const IMPLEMENTATION_CLASS_UID = '2.25.270695996825855179949881587723571202391.2.0.0';
const IMPLEMENTATION_VERSION_NAME = 'OHIF';

export type SourceDisplaySetLike = {
  StudyInstanceUID?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  AccessionNumber?: string;
  /** Naturalized PN (string or `{ Alphabetic }`) from OHIF display set */
  PatientName?: string | Record<string, unknown>;
  PatientID?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
};

function canvasToRgbInterleaved(canvas: HTMLCanvasElement): {
  columns: number;
  rows: number;
  pixelData: ArrayBuffer;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for DICOM export');
  }
  const columns = canvas.width;
  const rows = canvas.height;
  const imageData = ctx.getImageData(0, 0, columns, rows);
  const src = imageData.data;
  const rgb = new Uint8Array(columns * rows * 3);
  let o = 0;
  for (let i = 0; i < src.length; i += 4) {
    rgb[o++] = src[i];
    rgb[o++] = src[i + 1];
    rgb[o++] = src[i + 2];
  }
  return { columns, rows, pixelData: rgb.buffer };
}

function formatDicomDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function formatDicomTime(d: Date): string {
  return `${d.toISOString().slice(11, 19).replace(/:/g, '')}.000`;
}

/**
 * Builds a single-frame Secondary Capture DICOM (explicit VR little endian, RGB 8-bit).
 * Pixel data matches the capture canvas (annotations / warning overlay included).
 * Reuses study / patient identifiers from the source display set when available.
 */
export function buildSecondaryCaptureDicomBlob(
  canvas: HTMLCanvasElement,
  options: { source?: SourceDisplaySetLike | null; seriesDescription?: string } = {}
): Blob {
  const { columns, rows, pixelData } = canvasToRgbInterleaved(canvas);
  const { DicomMetaDictionary } = dcmjs.data;
  const uid = () => DicomMetaDictionary.uid();

  const now = new Date();
  const studyUID = options.source?.StudyInstanceUID || uid();
  const seriesUID = uid();
  const instanceUID = uid();
  const da = options.source?.StudyDate || formatDicomDate(now);
  const tm = options.source?.StudyTime || formatDicomTime(now);

  const dataset: Record<string, unknown> = {
    _meta: {
      FileMetaInformationVersion: new Uint8Array([0, 1]),
      MediaStorageSOPClassUID: SECONDARY_CAPTURE_SOP_CLASS,
      MediaStorageSOPInstanceUID: instanceUID,
      TransferSyntaxUID: EXPLICIT_VR_LITTLE_ENDIAN,
      ImplementationClassUID: IMPLEMENTATION_CLASS_UID,
      ImplementationVersionName: IMPLEMENTATION_VERSION_NAME,
    },
    _vrMap: {
      PixelData: 'OW',
    },
    SpecificCharacterSet: 'ISO_IR 192',
    ImageType: ['DERIVED', 'SECONDARY', 'SCREEN SAVE'],
    SOPClassUID: SECONDARY_CAPTURE_SOP_CLASS,
    SOPInstanceUID: instanceUID,
    StudyInstanceUID: studyUID,
    SeriesInstanceUID: seriesUID,
    StudyDate: da,
    StudyTime: tm,
    SeriesDate: formatDicomDate(now),
    SeriesTime: formatDicomTime(now),
    ContentDate: formatDicomDate(now),
    ContentTime: formatDicomTime(now),
    Modality: 'OT',
    SeriesNumber: '999',
    InstanceNumber: '1',
    SeriesDescription: options.seriesDescription || 'OHIF viewport capture',
    Rows: rows,
    Columns: columns,
    SamplesPerPixel: 3,
    PhotometricInterpretation: 'RGB',
    PlanarConfiguration: 0,
    NumberOfFrames: 1,
    BitsAllocated: 8,
    BitsStored: 8,
    HighBit: 7,
    PixelRepresentation: 0,
    PixelData: pixelData,
  };

  if (options.source?.PatientName != null) {
    dataset.PatientName = options.source.PatientName;
  }
  if (options.source?.PatientID) {
    dataset.PatientID = options.source.PatientID;
  }
  if (options.source?.PatientBirthDate) {
    dataset.PatientBirthDate = options.source.PatientBirthDate;
  }
  if (options.source?.PatientSex) {
    dataset.PatientSex = options.source.PatientSex;
  }
  if (options.source?.StudyDescription) {
    dataset.StudyDescription = options.source.StudyDescription;
  }
  if (options.source?.AccessionNumber) {
    dataset.AccessionNumber = options.source.AccessionNumber;
  }

  return dcmjs.data.datasetToBlob(dataset);
}
