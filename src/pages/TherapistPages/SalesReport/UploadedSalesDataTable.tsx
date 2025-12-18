import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import Button from "../../../components/ui/button/Button";

interface MilkReport {
  [key: string]: any; // Dynamic keys from uploaded Excel
}

export default function SupervisorUploadedSalesDataTable() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [reports, setReports] = useState<MilkReport[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>(""); // Added filter state

  const hiddenColumns = ["_id", "__v", "createdAt", "updatedAt", "uploadedBy"];

  const fetchReports = async (pageNumber: number) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/supervisor/get-uploaded-sales-report`,
        {
          params: { page: pageNumber, limit },
          headers: { Authorization: localStorage.getItem("supervisor-token") },
        }
      );

      setReports(res.data.data || []);
      setColumns(
        res.data.data.length > 0
          ? Object.keys(res.data.data[0]).filter(
              (col) => !hiddenColumns.includes(col)
            )
          : []
      );
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.currentPage || 1);
    } catch (err) {
      console.error("Error fetching milk reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string | Date | null, withTime = false) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime && { hour: "2-digit", minute: "2-digit" }),
    }).format(date);
  };

  useEffect(() => {
    fetchReports(page);
  }, [page]);

  // Filtering logic: filter by the whole row (all column values as a string, case-insensitive)
  const filterText = filter.trim().toLowerCase();
  const filteredReports = filterText
    ? reports.filter((row) => {
        const rowStr = columns
          .map((col) => {
            if (col === "uploadedOn")
              return formatDate(row[col], true);
            if (col === "docDate")
              return formatDate(row[col]);
            return row[col] !== undefined && row[col] !== null ? String(row[col]) : "";
          })
          .join(" ")
          .toLowerCase();
        return rowStr.includes(filterText);
      })
    : reports;

  if (loading) {
    return <p className="p-4 text-gray-500">Loading reports...</p>;
  }

  if (!filteredReports || filteredReports.length === 0) {
    return <p className="p-4 text-gray-500">No data available</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        {/* Filter input */}
        <div className="p-4">
          <input
            type="text"
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
            placeholder="Search in all columns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {col.trim()}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredReports.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    {col === "uploadedOn"
                      ? formatDate(row[col]) // show with time
                      : col === "docDate"
                      ? formatDate(row[col]) // show only date
                      : row[col] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </Button>
        <p className="text-gray-500">
          Page {page} of {totalPages}
        </p>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
