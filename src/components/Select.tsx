import { FormControl, InputLabel, MenuItem, Select as MUISelect } from "@mui/material"

interface Option<T extends number | string> {
    value: T;
    name: string;
}

interface SelectProps<T extends number | string> {
    value: T;
    onChange: (value: T) => void;
    label: string,
    options: Option<T>[]
}

const Select = <T extends number | string,>({value, onChange, label, options}: SelectProps<T>) => {
    return (<FormControl>
        <InputLabel>{label}</InputLabel>
        <MUISelect
            size='small'
            value={value}
            label={label}
            onChange={(x) => {
                console.log(x, typeof x);
                onChange(x.target.value as T)
            }}
        >
            {options.map((x, idx) => (
                <MenuItem key={idx} value={x.value}>{x.name}</MenuItem>
            ))}
        </MUISelect>
    </FormControl>)  
}

export default Select