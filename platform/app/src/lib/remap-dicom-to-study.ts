import dcmjs from 'dcmjs';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;
const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'Vigil-Hub-Study-Upload';

export type StudyUploadContext = {
  studyInstanceUid: string;
  /** When set, all instances in one upload batch share this series (single series in viewer). */
  seriesInstanceUid?: string;
  patientId?: string;
  patientName?: string;
  accessionNumber?: string;
  studyDescription?: string;
  studyDate?: string;
  studyTime?: string;
};

export type OrthancMainDicomTags = {
  StudyInstanceUID?: string;
  PatientID?: string;
  PatientName?: string;
  AccessionNumber?: string;
  StudyDescription?: string;
  StudyDate?: string;
  StudyTime?: string;
};

export function mergeStudyUploadContext(
  orthancMain: OrthancMainDicomTags,
  ui: StudyUploadContext
): StudyUploadContext {
  return {
    studyInstanceUid: orthancMain.StudyInstanceUID?.trim() || ui.studyInstanceUid,
    patientId: orthancMain.PatientID?.trim() || ui.patientId,
    patientName: orthancMain.PatientName?.trim() || ui.patientName,
    accessionNumber: orthancMain.AccessionNumber?.trim() || ui.accessionNumber,
    studyDescription: orthancMain.StudyDescription?.trim() || ui.studyDescription,
    studyDate: orthancMain.StudyDate?.trim() || ui.studyDate,
    studyTime: orthancMain.StudyTime?.trim() || ui.studyTime,
  };
}

export function generateDicomUid(): string {
  const random = Math.floor(Math.random() * 1e9);
  return `2.25.${Date.now()}.${random}`;
}

function setTag(dataset: Record<string, unknown>, tag: string, value?: string) {
  if (value === undefined || value === null) {
    return;
  }
  const s = String(value).trim();
  if (!s.length) {
    return;
  }
  dataset[tag] = s;
}

function toArrayBuffer(written: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (written instanceof ArrayBuffer) {
    return written;
  }
  return written.buffer.slice(written.byteOffset, written.byteOffset + written.byteLength);
}

/**
 * Rewrite study/patient tags and assign a new SOP Instance UID so Orthanc does not
 * short-circuit to AlreadyStored under another study.
 */
export function remapDicomBufferToStudy(
  buffer: ArrayBuffer,
  context: StudyUploadContext
): ArrayBuffer {
  const dicomData = dcmjs.data.DicomMessage.readFile(buffer);
  const dataset = naturalizeDataset(dicomData.dict) as Record<string, unknown>;

  const newSopInstanceUid = generateDicomUid();

  setTag(dataset, 'StudyInstanceUID', context.studyInstanceUid);
  if (context.seriesInstanceUid) {
    setTag(dataset, 'SeriesInstanceUID', context.seriesInstanceUid);
  }
  setTag(dataset, 'PatientID', context.patientId);
  setTag(dataset, 'PatientName', context.patientName);
  setTag(dataset, 'AccessionNumber', context.accessionNumber);
  setTag(dataset, 'StudyDescription', context.studyDescription);
  setTag(dataset, 'StudyDate', context.studyDate);
  setTag(dataset, 'StudyTime', context.studyTime);
  setTag(dataset, 'SOPInstanceUID', newSopInstanceUid);

  const sopClass = dataset.SOPClassUID as string | undefined;

  const metaSource = dicomData.meta as {
    FileMetaInformationVersion?: { Value?: unknown[] };
    TransferSyntaxUID?: { Value?: string[] };
  };

  const transferSyntax =
    metaSource?.TransferSyntaxUID?.Value?.[0] || EXPLICIT_VR_LITTLE_ENDIAN;

  const meta = {
    FileMetaInformationVersion: metaSource?.FileMetaInformationVersion?.Value,
    MediaStorageSOPClassUID: sopClass,
    MediaStorageSOPInstanceUID: newSopInstanceUid,
    TransferSyntaxUID: transferSyntax,
    ImplementationClassUID,
    ImplementationVersionName,
  };

  const dicomDict = new DicomDict(denaturalizeDataset(meta));
  dicomDict.dict = denaturalizeDataset(dataset);
  return toArrayBuffer(dicomDict.write());
}
