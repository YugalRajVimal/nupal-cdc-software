import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

// Define the interface for an ExcelSheet
interface ExcelSheet {
  id: number;
  uploadDate: string;
  rowsCount: number;
  link: String;
}

// Define the table data for Excel Sheets
const excelSheetData: ExcelSheet[] = [
  {
    id: 1,
    uploadDate: "2023-01-15",
    rowsCount: 1200,
    link: "/sub-admin/milk-report-view",
  },
  {
    id: 2,
    uploadDate: "2023-02-20",
    rowsCount: 850,
    link: "/sub-admin/milk-report-view",
  },
  {
    id: 3,
    uploadDate: "2023-03-10",
    rowsCount: 2100,
    link: "/sub-admin/milk-report-view",
  },
  {
    id: 4,
    uploadDate: "2023-04-05",
    rowsCount: 930,
    link: "/sub-admin/milk-report-view",
  },
  {
    id: 5,
    uploadDate: "2023-05-18",
    rowsCount: 1500,
    link: "/sub-admin/milk-report-view",
  },
];

export default function SupervisorExcelSheetsList() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Sr. No.
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Rows Count
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {excelSheetData.map((sheet) => (
              <TableRow key={sheet.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-center">
                  {sheet.id}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {sheet.uploadDate}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {sheet.rowsCount}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  <Link
                    to={sheet.link as any}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-blue-500 px-3 py-1.5 text-theme-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-3"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
