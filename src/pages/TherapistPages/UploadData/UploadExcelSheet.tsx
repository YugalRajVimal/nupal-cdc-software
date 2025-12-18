import { useState } from "react";
import axios from "axios";
import ComponentCard from "../../../components/common/ComponentCard";
import FileInput from "../../../components/form/input/FileInput";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";

interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export default function UploadExcelSheet() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // Removed `message` state as `alert` will handle all messages

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false, // Initially disabled, only show when an alert occurs
    variant: "info", // Default variant, will be overridden on alert
    title: "",
    message: "",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const allowedTypes = [
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      ];

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        // Clear any previous alerts when a valid file is selected
        setAlert({ isEnable: false, variant: "info", title: "", message: "" });
      } else {
        setFile(null); // Clear the file state if an invalid file type is selected
        setAlert({
          isEnable: true,
          variant: "error",
          title: "Invalid File Type",
          message: "Only Excel files (.xls, .xlsx) are allowed.",
        });
      }
    } else {
      // If no file is selected (e.g., user cancels the file dialog)
      setFile(null);
      // Clear any previous alerts
      setAlert({ isEnable: false, variant: "info", title: "", message: "" });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setAlert({
        isEnable: true,
        variant: "warning",
        title: "No file selected",
        message: "Please select an Excel file to upload.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      // Clear any previous alerts before a new upload attempt
      setAlert({ isEnable: false, variant: "info", title: "", message: "" });

      const token = localStorage.getItem("sub-admin-token"); // adjust if you store differently

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sub-admin/upload-excel-file`,
        formData,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAlert({
        isEnable: true,
        variant: "success",
        title: "Upload Successful",
        message: `${res.data.message} (${res.data.rowsLength} rows saved)`,
      });
    } catch (err: any) {
      console.error("Upload failed:", err);
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Upload Failed",
        message: err.response?.data?.error || "Failed to upload Excel file.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ComponentCard title="Upload Milk Register Report">
        <div>
          {alert.isEnable && (
            <Alert
              variant={alert.variant as any}
              title={alert.title}
              message={alert.message}
            />
          )}
          <Label className="mt-4">Upload Excel file</Label>
          <FileInput onChange={handleFileChange} className="custom-class" />

          <Button
            className="my-8 w-40"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>

          {/* {message && (
            <p
              className={`mt-2 text-sm ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )} */}
        </div>
      </ComponentCard>
    </>
  );
}
