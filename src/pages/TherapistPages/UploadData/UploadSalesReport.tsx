import ComponentCard from "../../../components/common/ComponentCard";
import FileInput from "../../../components/form/input/FileInput";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { useState } from "react";
import axios from "axios";

interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export default function UploadSalesSheet() {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    vlcUploaderCode: "",
    itemCode: "",
    itemName: "",
    quantity: "",
    docDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  // 📌 Handle file input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const allowedTypes = [
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      ];

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        // Clear any previous file-related alerts if a valid file is selected
        setAlert({
          isEnable: false,
          variant: "info",
          title: "",
          message: "",
        });
      } else {
        setFile(null); // Reset file state
        setAlert({
          isEnable: true,
          variant: "error",
          title: "Invalid File Type",
          message: "❌ Only Excel files (.xls, .xlsx) are allowed.",
        });
        // Optionally clear the input field value to allow re-selection of the same file
        event.target.value = '';
      }
    } else {
      setFile(null); // If no file is selected (e.g., user cancels selection)
      // Clear any file-related alerts
      setAlert({
        isEnable: false,
        variant: "info",
        title: "",
        message: "",
      });
    }
  };

  // 📌 Upload Excel File
  const handleUploadExcel = async () => {
    if (!file) {
      setAlert({
        isEnable: true,
        variant: "warning",
        title: "Missing File",
        message: "⚠️ Please select an Excel file before uploading.",
      });
      return;
    }

    const data = new FormData();
    data.append("file", file);

    try {
      setLoading(true);
      const token = localStorage.getItem("sub-admin-token");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sub-admin/upload-sales-report`,
        data,
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
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Upload Failed",
        message:
          err.response?.data?.error || "❌ Failed to upload sales report.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 📌 Handle form field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📌 Save Manual Entry
  const handleSaveEntry = async () => {
    const { itemCode, itemName, vlcUploaderCode, quantity, docDate } = formData;

    if (!itemCode || !itemName || !vlcUploaderCode || !quantity || !docDate) {
      setAlert({
        isEnable: true,
        variant: "warning",
        title: "Validation Error",
        message: "⚠️ All fields are required.",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("sub-admin-token");

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sub-admin/add-sales-report`,
        { itemCode, itemName, vlcUploaderCode, quantity, docDate },
        {
          headers: { Authorization: `${token}` },
        }
      );

      setAlert({
        isEnable: true,
        variant: "success",
        title: "Entry Saved",
        message: res.data.message,
      });

      // reset form
      setFormData({
        vlcUploaderCode: "",
        itemCode: "",
        itemName: "",
        quantity: "",
        docDate: "",
      });
    } catch (err: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Save Failed",
        message: err.response?.data?.error || "❌ Failed to save sales report.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ComponentCard title="Upload Sales Register Report" className="mt-4">
        {alert.isEnable && (
          <Alert
            variant={alert.variant as any}
            title={alert.title}
            message={alert.message}
          />
        )}

        {/* Excel Upload Section */}
        <ComponentCard title="Upload Excel File">
          <div>
            <Label>Upload excel file</Label>
            <FileInput onChange={handleFileChange} className="custom-class" />
            <Button
              className="my-8 w-40"
              onClick={handleUploadExcel}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </ComponentCard>

        <div className="w-full text-center">----- OR -----</div>

        {/* Manual Entry Section */}
        <ComponentCard title="Record Entry">
          <div className="flex gap-4 flex-col">
            <div className="flex w-full gap-4">
              <div className="w-full">
                <Label>Vendor Code</Label>
                <Input
                  name="vlcUploaderCode"
                  placeholder="123456"
                  type="text"
                  value={formData.vlcUploaderCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex w-full gap-4">
              <div className="w-1/2">
                <Label>Item Code</Label>
                <Input
                  name="itemCode"
                  placeholder="123456"
                  type="text"
                  value={formData.itemCode}
                  onChange={handleChange}
                />
              </div>

              <div className="w-1/2">
                <Label>Item Name</Label>
                <Input
                  name="itemName"
                  placeholder="Milk Packet"
                  type="text"
                  value={formData.itemName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex w-full gap-4">
              <div className="w-1/2">
                <Label>Quantity</Label>
                <Input
                  name="quantity"
                  placeholder="100"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="w-1/2">
                <Label>Document Date</Label>
                <Input
                  name="docDate"
                  placeholder="DD-MM-YYYY"
                  type="date"
                  value={formData.docDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button
              className="my-8 w-40"
              onClick={handleSaveEntry}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </ComponentCard>
      </ComponentCard>
    </>
  );
}
