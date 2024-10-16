import { FormControl, Typography, Slider as MUISlider } from "@mui/material";
import { FC } from "react"

export interface SliderProps {
    value: number;
    setValue: (n: number) => void;
    label: string;
    display: (value: number) => string;
    min?: number;
    max?: number;
    step?: number;
}

const Slider: FC<SliderProps> = ({value, setValue, label, display, min=1, max=100, step=1}) => {

    return (
        <FormControl size='small' fullWidth style={{padding: 5, position: 'relative'}}>
                
                <Typography id="input-slider" gutterBottom>
                    {label}
                </Typography>
                <MUISlider
                    size="small"
                    aria-label={label}
                    value={value}
                    onChange={(n) => setValue(parseInt((n.target as HTMLInputElement).value))}
                    valueLabelDisplay='auto'
                    valueLabelFormat={v => display(v)}
                    min={min}
                    max={max}
                    step={step}
                />
            </FormControl>
    )
    return (<div className="c-slider">
            <label className="c-slider__label">{label} ({display(value)})</label>
            <input
                className="c-slider__input"
                style={{width: '100%'}}
                type="range"
                min={min}
                max={max}
                step={step}
                onChange={e => setValue(parseInt(e.target.value))} value={value}
            />
    </div>)
}

export default Slider