import clsx from 'clsx';
import {FC, useId, useRef, useState} from 'react';
import {
  KnobHeadless,
  KnobHeadlessLabel,
  KnobHeadlessOutput,
  useKnobKeyboardControls,
} from 'react-knob-headless';
import {mapFrom01Linear, mapTo01Linear} from '@dsp-ts/math';
import { transform } from 'lodash';

type KnobBaseThumbProps = {
  readonly theme: 'stone' | 'pink' | 'green' | 'sky';
  readonly value01: number;
};

export function KnobBaseThumb({theme, value01}: KnobBaseThumbProps) {
  const angleMin = -145;
  const angleMax = 145;
  const angle = mapFrom01Linear(value01, angleMin, angleMax);
  return (
    <div
      className={clsx(
        'absolute h-full w-full rounded-full',
        theme === 'stone' && 'bg-stone-300',
        theme === 'pink' && 'bg-pink-300',
        theme === 'green' && 'bg-green-300',
        theme === 'sky' && 'bg-sky-300',
      )}
    >
      <div className='absolute h-full w-full' style={{rotate: `${angle}deg`}}>
        <div className='absolute left-1/2 top-0 h-1/2 w-[2px] -translate-x-1/2 rounded-sm bg-stone-950' />
      </div>
    </div>
  );
}

type KnobHeadlessProps = React.ComponentProps<typeof KnobHeadless>;
type KnobBaseProps = Pick<
  KnobHeadlessProps,
  | 'valueMin'
  | 'valueMax'
  | 'valueRawRoundFn'
  | 'valueRawDisplayFn'
  | 'orientation'
  | 'mapTo01'
  | 'mapFrom01'
> &
  Pick<KnobBaseThumbProps, 'theme'> & {
    readonly label: string;
    readonly valueDefault: number;
    readonly stepFn: (valueRaw: number) => number;
    readonly stepLargerFn: (valueRaw: number) => number;
  };

export function KnobBase({
  theme,
  label,
  valueDefault,
  valueMin,
  valueMax,
  valueRawRoundFn,
  valueRawDisplayFn,
  orientation,
  stepFn,
  stepLargerFn,
  mapTo01 = mapTo01Linear,
  mapFrom01 = mapFrom01Linear,
}: KnobBaseProps) {
  const knobId = useId();
  const labelId = useId();
  const [valueRaw, setValueRaw] = useState<number>(valueDefault);
  const value01 = mapTo01(valueRaw, valueMin, valueMax);
  const step = stepFn(valueRaw);
  const stepLarger = stepLargerFn(valueRaw);
  const dragSensitivity = 0.006;

  const keyboardControlHandlers = useKnobKeyboardControls({
    valueRaw,
    valueMin,
    valueMax,
    step,
    stepLarger,
    onValueRawChange: setValueRaw,
  });

  return (
    <div
      className={clsx(
        'w-16 flex flex-col gap-0.5 justify-center items-center text-xs select-none',
        'outline-none focus-within:outline-1 focus-within:outline-offset-4 focus-within:outline-stone-300',
      )}
    >
      <KnobHeadlessLabel id={labelId}>{label}</KnobHeadlessLabel>
      <KnobHeadless
        id={knobId}
        aria-labelledby={labelId}
        className='relative w-16 h-16 outline-none'
        valueMin={valueMin}
        valueMax={valueMax}
        valueRaw={valueRaw}
        valueRawRoundFn={valueRawRoundFn}
        valueRawDisplayFn={valueRawDisplayFn}
        dragSensitivity={dragSensitivity}
        orientation={orientation}
        mapTo01={mapTo01}
        mapFrom01={mapFrom01}
        onValueRawChange={setValueRaw}
        {...keyboardControlHandlers}
      >
        <KnobBaseThumb theme={theme} value01={value01} />
      </KnobHeadless>
      <KnobHeadlessOutput htmlFor={knobId}>
        {valueRawDisplayFn(valueRaw)}
      </KnobHeadlessOutput>
    </div>
  );
}

interface KnobProps {
    color?: string;
    value: number;
    setValue: (n: number) => void;
    min: number;
    max: number;
    label: string;
    id: string;
    displayValue: (v: number) => string;
    mapToAngle?: (v: number) => number;
    textColor: string;
    onLongPress?: () => void;
}

export const Knob : FC<KnobProps> = ({value, setValue, min, max, displayValue, label, id, mapToAngle=v => v, color='white', textColor='white', onLongPress=() => {}}) => {
  const angleMin = -145;
  const angleMax = 145;

  const angle = mapFrom01Linear(mapToAngle(value), angleMin, angleMax);

  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
      onLongPress()
    }, 500);
  };

  const cancelMouseDown = () => {
    holdTimeout.current && clearTimeout(holdTimeout.current);
  };

  return (
    <div
      style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexDirection: 'column', outline: 'none'}}
    >
        <KnobHeadlessLabel id={id} style={{color: textColor}}>{label}</KnobHeadlessLabel>
        <KnobHeadless
            onMouseDown={handleMouseDown}
            onMouseUp={cancelMouseDown}
            onMouseMove={cancelMouseDown}
            id={id}
            style={{outline:'none'}}
            aria-labelledby={id}
            className='relative w-16 h-16 outline-none'
            valueMin={min}
            valueMax={max}
            valueRaw={value}
            valueRawRoundFn={v => v}
            valueRawDisplayFn={displayValue}
            dragSensitivity={0.05}
            // orientation={orientation}
            mapTo01={mapTo01Linear}
            mapFrom01={mapFrom01Linear}
            onValueRawChange={setValue}
        >
            <div style={{transition: 'background 250ms ease', width: 50, position: 'relative', height: 50, background: color, borderRadius: '50%', rotate: `${angle}deg`, border: '1px solid black'}}>
              <div style={{width: 2, backgroundColor: 'black', transform: `translateX(25px)`, height: '25px'}}></div>
            </div>
        </KnobHeadless>
        <KnobHeadlessOutput htmlFor={id} style={{color: textColor}}>
            {displayValue(value)}
        </KnobHeadlessOutput>
    </div>
  );
}

// type KnobPercentageProps = Pick<
//   KnobBaseProps,
//   'theme' | 'label' | 'orientation'
// >;

// export function KnobPercentage(props: KnobPercentageProps) {
//   return (
//     <KnobBase
//       valueDefault={valueDefault}
//       valueMin={valueMin}
//       valueMax={valueMax}
//       stepFn={stepFn}
//       stepLargerFn={stepLargerFn}
//       valueRawRoundFn={valueRawRoundFn}
//       valueRawDisplayFn={valueRawDisplayFn}
//       {...props}
//     />
//   );
// }

// const valueMin = 0;
// const valueMax = 100;
// const valueDefault = 50;
// const stepFn = (valueRaw: number): number => 1;
// const stepLargerFn = (valueRaw: number): number => 10;
// const valueRawRoundFn = Math.round;
// const valueRawDisplayFn = (valueRaw: number): string =>
//   `${valueRawRoundFn(valueRaw)}%`;