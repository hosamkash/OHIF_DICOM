import React from 'react';
import ModeRoute from '@routes/Mode';
import { viewerModePathname } from '../constants/viewerRoutes';

/*
  Routes uniquely define an entry point to:
  - A mode
  - Linked to a data source
  - With a specified data set.

  The full route template is:

  /:modeId/:modeRoute/:sourceType/?queryParameters=example

  Where:
  :modeId - Is the mode selected.
  :modeRoute - Is the route within the mode to select.
  :sourceType - Is the data source identifier, which specifies which DataSource to use.
  ?queryParameters - Are query parameters as defined by data source.

  A default source can be specified at the app level configuration, and then that source is used if :sourceType is omitted:

  /:modeId/:modeRoute/?queryParameters=example
 */
export default function buildModeRoutes({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}: withAppTypes) {
  const routes = [];
  const dataSourceNames = [];

  dataSources.forEach(dataSource => {
    const { sourceName } = dataSource;
    if (!dataSourceNames.includes(sourceName)) {
      dataSourceNames.push(sourceName);
    }
  });

  modes.forEach(mode => {
    // todo: for each route. add route to path.
    dataSourceNames.forEach(dataSourceName => {
      const prefixedPath = viewerModePathname(mode.routeName, dataSourceName);
      const legacyPath = `${mode.routeName}/${dataSourceName}`;

      // TODO move up.
      const children = () => (
        <ModeRoute
          mode={mode}
          dataSourceName={dataSourceName}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          hotkeysManager={hotkeysManager}
        />
      );

      routes.push({
        path: prefixedPath.replace(/^\//, ''),
        children,
        private: true,
      });
      routes.push({
        path: legacyPath.replace(/^\//, ''),
        children,
        private: true,
      });
    });

    // Add active DataSource route.
    // This is the DataSource route for the active data source defined in ExtensionManager.getActiveDataSource
    const prefixedModeOnly = viewerModePathname(mode.routeName, '');
    const legacyModeOnly = `${mode.routeName}`;

    // TODO move up.
    const children = () => (
      <ModeRoute
        mode={mode}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        hotkeysManager={hotkeysManager}
      />
    );

    routes.push({
      path: prefixedModeOnly.replace(/^\//, ''),
      children,
      private: true,
    });
    routes.push({
      path: legacyModeOnly.replace(/^\//, ''),
      children,
      private: true,
    });
  });

  return routes;
}
