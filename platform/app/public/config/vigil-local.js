/**
 * Vigil — local PACS (modes 1 & 2)
 * Orthanc: http://localhost:8042 via dev-server proxy /pacs → Orthanc
 *
 * Run from repo root:
 *   yarn dev:vigil:local
 * Or platform/app:
 *   yarn dev:vigil:local
 *
 * Open: http://localhost:3000/ohif/viewer?StudyInstanceUIDs=...
 */
/** @type {AppTypes.Config} */
window.config = {
  name: 'config/vigil-local.js',
  routerBasename: null,
  extensions: [],
  modes: [],
  showStudyList: true,
  maxNumberOfWebWorkers: 3,
  showLoadingIndicator: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  strictZSpacingForVolumeViewport: true,
  defaultDataSourceName: 'vigilOrthanc',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'vigilOrthanc',
      configuration: {
        friendlyName: 'Vigil Orthanc (local)',
        name: 'VigilLocal',
        wadoUriRoot: '/wado',
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
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  },
};
