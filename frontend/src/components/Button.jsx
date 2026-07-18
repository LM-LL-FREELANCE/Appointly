import { Button } from "@mantine/core";

export default function ButtonLay({ label, link, type, ...props }) {
  return (
    <Button onClick={link} variant={type} {...props}>
      {label}
    </Button>
  )
}