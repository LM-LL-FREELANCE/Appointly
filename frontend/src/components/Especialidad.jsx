import { Checkbox } from "@mantine/core";

export default function Especialidad({ key, value, label }) {
    return (
        <Checkbox key={key} value={value} label={label} />
    )
}