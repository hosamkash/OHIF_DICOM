/**
 * Vigil — cloud PACS (modes 3 & 4)
 * Edit ORTHANC_DICOMWEB_ROOT before deploy (must match tenant DICOM tab → Orthanc URL + /dicom-web).
 * Enable CORS on Orthanc for https://dicomviewer.vigilhub.app (and www.vigilhub.app if embedded).
 *
 * Build:
 *   yarn build:vigil:cloud
 * Vercel env (optional override without rebuild):
 *   Set ORTHANC_DICOMWEB_ROOT in vigil-cloud if you inject at build via CI — default below.
 */
(function () {
  /** @type {string} Public DICOMweb root (no trailing slash) */
  const ORTHANC_DICOMWEB_ROOT = 'http://35.242.134.20:8042/dicom-web';

  /** @type {AppTypes.Config} */
  window.config = {
    name: 'config/vigil-cloud.js',
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
          friendlyName: 'Vigil Orthanc (cloud)',
          name: 'VigilCloud',
          wadoUriRoot: ORTHANC_DICOMWEB_ROOT,
          qidoRoot: ORTHANC_DICOMWEB_ROOT,
          wadoRoot: ORTHANC_DICOMWEB_ROOT,
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
})();
