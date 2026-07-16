import { Button } from "@mantine/core";

export default function ButtonLay({ label, link, type }) {
  return (
    <>
      <Button onClick={link} variant={type}>{label}</Button>
    </>
  )
}