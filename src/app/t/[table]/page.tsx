import { TableRedirect } from "./table-redirect";

export default async function TableLanding({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  return <TableRedirect table={table} />;
}
