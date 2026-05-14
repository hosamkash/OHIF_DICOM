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
  /** أوضاع OHIF المجمّعة في pluginConfig — تفعيلها يظهر مسارات عرض مختلفة (/ohif/basic، segmentation، …). */
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
  customButtons: [
    {
      id: 'exportShareHub',
      label: 'تصدير ومشاركة',
      icon: 'external-link',
      type: 'command',
      commandName: 'openViewerExportHubDialog',
      context: 'VIEWER',
    },
  ],
  commandsManager: {
    commands: {},
  },
};
