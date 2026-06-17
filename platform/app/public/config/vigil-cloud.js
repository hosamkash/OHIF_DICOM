/**
 * Vigil — cloud (Vercel + Orthanc at orthanc.vigilhub.app)
 * DICOMweb: /pacs/dicom-web → Vercel api/pacs proxy (auth server-side).
 * Do NOT put Orthanc password here — set ORTHANC_PASSWORD on Vercel.
 */
/** @type {AppTypes.Config} */
window.config = {
  name: 'config/vigil-cloud.js',
  routerBasename: '/',
  showStudyList: true,
  defaultDataSourceName: 'vigilOrthanc',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'vigilOrthanc',
      configuration: {
        friendlyName: 'Vigil Orthanc (cloud)',
        name: 'VigilCloud',
        wadoUriRoot: '/pacs/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        dicomUploadEnabled: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
  studyPrefetcher: {
    enabled: false,
    displaySetsCount: 1,
  },
  enableStudyLazyLoad: true,
  maxNumberOfWebWorkers: 2,
  useSharedArrayBuffer: 'FALSE',
  modes: [
    '@ohif/mode-longitudinal',
    '@ohif/mode-basic',
    '@ohif/mode-segmentation',
    '@ohif/mode-preclinical-4d',
    '@ohif/mode-tmtv',
    '@ohif/mode-microscopy',
    '@ohif/mode-ultrasound-pleura-bline',
  ],
  extensions: [],
  cornerstoneExtensionConfig: {
    imageRendering: 'pixelated',
    tools: {
      StackScroll: {
        configuration: {
          debounceIfNotLoaded: true,
          loop: false,
        },
      },
    },
  },
  showLoadingIndicator: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  strictZSpacingForVolumeViewport: true,
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  },
};
