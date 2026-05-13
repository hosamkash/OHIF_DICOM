/** @type {AppTypes.Config} */

window.config = {
  routerBasename: '/',
  showStudyList: true,
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc PACS',
        name: 'orthanc',
        wadoUriRoot: '/pacs/wado',
        qidoRoot: '/pacs/dicom-web',
        wadoRoot: '/pacs/dicom-web',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        dicomUploadEnabled: true,
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
  studyPrefetcher: {
    enabled: false,
    displaySetsCount: 1,
  },
  enableStudyLazyLoad: true,
  maxNumberOfWebWorkers: 2,
  useSharedArrayBuffer: 'FALSE',
  modes: ['@ohif/mode-longitudinal'],
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
  customButtons: [
    {
      id: 'downloadPdf',
      label: 'تقرير PDF',
      icon: 'file-pdf',
      type: 'command',
      commandName: 'downloadPdfReport',
      context: 'VIEWER',
    },
  ],
  commandsManager: {
    commands: {
      downloadPdfReport: {
        commandFn: ({ servicesManager }) => {
          const { viewportGridService } = servicesManager.services;
          const { activeViewportId, viewports } = viewportGridService.getState();
          const studyUID = viewports[activeViewportId]?.StudyInstanceUID;
          if (studyUID) {
            window.open(`/pacs/reports/pdf/${studyUID}`, '_blank');
          }
        },
        storeReferences: true,
      },
    },
  },
};
