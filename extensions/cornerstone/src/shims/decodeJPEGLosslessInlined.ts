/**
 * Inlined JPEG-LS decoder: static import so decodeImageFrameWorker does not load a separate
 * chunk via importScripts (often NetworkError under Rsbuild / dev server).
 * Mirrors @cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEGLossless.js
 */
import { Decoder } from 'jpeg-lossless-decoder-js';

const local: {
  DecoderClass: typeof Decoder | undefined;
  decodeConfig: unknown;
} = {
  DecoderClass: undefined,
  decodeConfig: {},
};

export function initialize(decodeConfig?: unknown) {
  local.decodeConfig = decodeConfig;
  if (local.DecoderClass) {
    return Promise.resolve();
  }
  local.DecoderClass = Decoder;
  return Promise.resolve();
}

async function decodeJPEGLossless(imageFrame: any, pixelData: any) {
  await initialize();
  if (typeof local.DecoderClass === 'undefined') {
    throw new Error('No JPEG Lossless decoder loaded');
  }
  const decoder = new local.DecoderClass();
  const byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  const buffer = pixelData.buffer;
  const decompressedData = decoder.decode(buffer, pixelData.byteOffset, pixelData.length, byteOutput);
  if (imageFrame.pixelRepresentation === 0) {
    if (imageFrame.bitsAllocated === 16) {
      imageFrame.pixelData = new Uint16Array(decompressedData.buffer);
      return imageFrame;
    }
    imageFrame.pixelData = new Uint8Array(decompressedData.buffer);
    return imageFrame;
  }
  imageFrame.pixelData = new Int16Array(decompressedData.buffer);
  return imageFrame;
}

export default decodeJPEGLossless;
