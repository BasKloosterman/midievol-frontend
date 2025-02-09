import { IconButton, IconButtonProps } from "@mui/material";
import { FC, useRef } from "react";

export const LearnIconButton: FC<
  { onLongPress: () => void } & Omit<
    IconButtonProps,
    "onMouseDown" | "onMouseUp" | "onMouseMove"
  >
> = ({onLongPress, ...rest}) => {
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
        onLongPress();
    }, 500);
  };

  const cancelMouseDown = () => {
    holdTimeout.current && clearTimeout(holdTimeout.current);
  };


  return (
    <IconButton
      {...rest}

      onMouseDown={handleMouseDown}
      onMouseUp={cancelMouseDown}
      onMouseMove={cancelMouseDown}
    />
  );
};
