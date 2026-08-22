import { Button } from "@mantine/core";

export default function ButtonLay({ label, isPending, link, typeColor, ...props }) {
  return (
    <Button onClick={link} disabled={isPending} variant={typeColor} {...props}>
      {label}
    </Button>
  )
}