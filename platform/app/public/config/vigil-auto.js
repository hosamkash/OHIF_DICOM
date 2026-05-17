/**
 * Vigil — one config file: localhost → proxy paths; production host → cloud Orthanc URL.
 * Dev: yarn dev:vigil:auto (needs Orthanc on :8042)
 * Build once for Vercel only if cloud URL is correct below; local dev still uses proxy paths.
 */
(function () {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  /** Cloud DICOMweb — edit to match tenant tab (Orthanc URL + /dicom-web) */
  const CLOUD_ORTHANC_DICOMWEB = 'http://35.242.134.20:8042/dicom-web';

  const dicomWebRoots = isLocal
    ? {
        wadoUriRoot: '/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
      }
    : {
        wadoUriRoot: CLOUD_ORTHANC_DICOMWEB,
        qidoRoot: CLOUD_ORTHANC_DICOMWEB,
        wadoRoot: CLOUD_ORTHANC_DICOMWEB,
      };

  /** @type {AppTypes.Config} */
  window.config = {
    name: 'config/vigil-auto.js',
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
          friendlyName: isLocal ? 'Vigil Orthanc (local)' : 'Vigil Orthanc (cloud)',
          name: isLocal ? 'VigilAutoLocal' : 'VigilAutoCloud',
          ...dicomWebRoots,
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
