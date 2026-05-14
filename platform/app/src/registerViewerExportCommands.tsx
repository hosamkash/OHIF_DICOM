import React from 'react';
import type { CommandsManager } from '@ohif/core';
import ViewerExportHubModal from './components/exportHub/ViewerExportHubModal';

export function registerViewerExportCommands(
  commandsManager: CommandsManager,
  servicesManager: AppTypes.ServicesManager
): void {
  const ctx = 'VIEWER';
  if (!commandsManager.getContext(ctx)) {
    commandsManager.createContext(ctx);
  }

  commandsManager.registerCommand(ctx, 'openViewerExportHubDialog', {
    commandFn: () => {
      const { uiModalService } = servicesManager.services;

      // Defer past the current pointer/click sequence so Radix Dialog does not treat
      // the opening click as an immediate outside interaction and dismiss.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          uiModalService.show({
            title: 'مركز التصدير والمشاركة',
            content: ViewerExportHubModal,
            containerClassName:
              'flex !h-[85vh] !max-h-[90vh] !w-[85vw] !max-w-[95vw] flex-col overflow-hidden !bg-slate-100 !p-3 !text-[#0b1120] sm:!p-4 [&_.text-highlight]:!text-[#0b1120]',
          });
        });
      });
    },
    storeReferences: true,
  });
}
