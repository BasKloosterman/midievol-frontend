
import { CheckboxProps, Checkbox } from "@mui/material"
import { FC, useRef } from "react"

export const LearnCheckbox: FC<
  { onLongPress: () => void } & Omit<
    CheckboxProps,
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
    <Checkbox
      {...rest}

      onMouseDown={handleMouseDown}
      onMouseUp={cancelMouseDown}
      onMouseMove={cancelMouseDown}
    />
  );
};