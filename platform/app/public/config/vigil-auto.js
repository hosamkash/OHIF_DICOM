/**
 * Vigil — local dev uses webpack proxy; production uses same-origin /pacs → orthanc.vigilhub.app.
 */
(function () {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  const dicomWebRoots = isLocal
    ? {
        wadoUriRoot: '/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
      }
    : {
        wadoUriRoot: '/pacs/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
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
          qidoSupportsIncludeField: false,
          supportsReject: true,
          dicomUploadEnabled: true,
          imageRendering: 'wadors',
          thumbnailRendering: 'wadors',
          enableStudyLazyLoad: true,
          supportsFuzzyMatching: false,
          supportsWildcard: false,
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
