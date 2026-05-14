import React from 'react';
import { useIconPresentation, Icons, Button } from '@ohif/ui-next';

export default function ToolButtonWrapper(props) {
  const { IconContainer, containerProps } = useIconPresentation();

  return (
    <div>
      {IconContainer ? (
        <IconContainer
          disabled={props.disabled}
          {...props}
          {...containerProps}
        />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          disabled={props.disabled}
        >
          <Icons.ByName name={props.icon} />
        </Button>
      )}
    </div>
  );
}

export { ToolButtonWrapper };
