import React from 'react';

function GlobalAppBanner() {
  return (
    <div
      aria-hidden
      role="presentation"
      // className="relative z-[100] shrink-0 border-b-[3px] border-amber-700 bg-yellow-300 min-h-[40px]"
      data-cy="global-app-banner"
    />
  );
}

export default GlobalAppBanner;
