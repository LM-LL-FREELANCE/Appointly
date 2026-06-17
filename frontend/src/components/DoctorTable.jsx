import { Table } from "@mantine/core";

export default function DoctorTable({ profesionales }) {
    const rows = profesionales.map(prof => (
        <Table.Tr key={prof.dni_profesional}>
            <Table.Td>{element.position}</Table.Td>
            <Table.Td>{element.name}</Table.Td>
            <Table.Td>{element.symbol}</Table.Td>
            <Table.Td>{element.mass}</Table.Td>
        </Table.Tr>
    ))
    return (
        <Table>

        </Table>
    )
}