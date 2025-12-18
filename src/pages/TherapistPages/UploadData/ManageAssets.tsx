import { useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import axios from "axios";

// ---------------- TYPES ----------------
interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface AssetReport {
  _id?: string;
  vlcCode: string;
  srNo?: string;
  stockNo?: string;
  rt?: number | string; // Changed to number | string
  duplicate?: number | string; // Changed to number | string
  vlcName?: string;
  status?: string;
  cStatus?: string;

  // Numeric fields
  can?: number | string;
  lid?: number | string;
  pvc?: number | string;
  keyboard?: number | string;
  printer?: number | string;
  charger?: number | string;
  stripper?: number | string;
  solar?: number | string;
  controller?: number | string;
  ews?: number | string;
  display?: number | string;
  battery?: number | string;
  bond?: string; // Changed from number | string to string
  vspSign?: number | string;

  dps?: string;
}

// ---------------- COMPONENT ----------------
export default function ManageAssets() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState<AssetReport>({
    vlcCode: "",
  });

  const [vlcSearch, setVlcSearch] = useState("");
  const [vlcOptions, setVlcOptions] = useState<AssetReport[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetReport | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------------- HANDLERS ----------------
  const handleChange = (field: keyof AssetReport, value: string) => {
    setFormData((prev) => {
      // If numeric field, convert to number (unless empty)
      const numericFields = [
        "can",
        "lid",
        "pvc",
        "keyboard",
        "printer",
        "charger",
        "stripper",
        "solar",
        "controller",
        "ews",
        "display",
        "battery",
        "vspSign",
        "rt", // Added 'rt'
        "duplicate", // Added 'duplicate'
      ];

      if (numericFields.includes(field as string)) {
        return { ...prev, [field]: value === "" ? "" : Number(value) };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleSearch = async (query: string) => {
    setVlcSearch(query);
    if (query.length < 2) {
      setVlcOptions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/sub-admin/get-assets-report`,
        {
          params: { search: query, limit: 5 },
          headers: { Authorization: localStorage.getItem("sub-admin-token") },
        }
      );
      setVlcOptions(res.data.data || []);
      console.log(res.data.data);
    } catch (error) {
      console.error("Error searching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (asset: AssetReport) => {
    setSelectedAsset(asset);
    setFormData(asset);
    setVlcOptions([]);
    setVlcSearch(asset.vlcCode);
  };

  const handleNewRecord = () => {
    setSelectedAsset(null);
    setFormData({ vlcCode: "" });
    setVlcSearch("");
  };

  const handleSaveEntry = async () => {
    try {
      let res;
      if (selectedAsset) {
        // Update mode
        res = await axios.post(
          `${API_URL}/api/sub-admin/update-assets-report`,
          formData,
          {
            headers: { Authorization: localStorage.getItem("sub-admin-token") },
          }
        );
        setAlert({
          isEnable: true,
          variant: "success",
          title: "Success",
          message: "Asset updated successfully ✅",
        });
      } else {
        // Add mode
        res = await axios.post(
          `${API_URL}/api/sub-admin/add-assets-report`,
          formData,
          {
            headers: { Authorization: localStorage.getItem("sub-admin-token") },
          }
        );
        setAlert({
          isEnable: true,
          variant: "success",
          title: "Success",
          message: "New asset added successfully ✅",
        });
      }
      setSelectedAsset(res.data.data);
    } catch (error: any) {
      console.error("Save error:", error);
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save asset",
      });
    }
  };

  // ---------------- RENDER ----------------
  return (
    <>
      <ComponentCard title="Manage Assets" className="mt-4 relative">
        {/* Alerts */}
        {alert.isEnable && (
          <Alert
            variant={alert.variant as any}
            title={alert.title}
            message={alert.message}
          />
        )}
        {/* Search and New Record button */}
        <div className="hidden md:flex absolute right-2 top-2 flex-row items-center gap-2 w-auto z-10">
          {selectedAsset && (
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded w-full sm:w-auto"
              onClick={handleNewRecord}
            >
              New Record
            </Button>
          )}
          {/* Search Dropdown */}
          <div className="w-full sm:w-64 relative">
            <Input
              placeholder="Search VLC Code..."
              type="text"
              value={vlcSearch}
              className="bg-zinc-200"
              onChange={(e) => handleSearch(e.target.value)}
            />
            {loading && (
              <div className="bg-white border p-2 shadow rounded absolute w-full z-20">
                Loading...
              </div>
            )}
            {vlcOptions.length > 0 && (
              <div className="bg-white border shadow rounded max-h-40 overflow-y-auto absolute w-full z-20">
                {vlcOptions.map((asset) => (
                  <div
                    key={asset._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectAsset(asset)}
                  >
                    {asset.vlcCode} - {asset.vlcName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden flex flex-col-reverse sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto z-10">
          {selectedAsset && (
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded w-full sm:w-auto"
              onClick={handleNewRecord}
            >
              New Record
            </Button>
          )}
          {/* Search Dropdown */}
          <div className="w-full sm:w-64 relative">
            <Input
              placeholder="Search VLC Code..."
              type="text"
              value={vlcSearch}
              className="bg-zinc-200"
              onChange={(e) => handleSearch(e.target.value)}
            />
            {loading && (
              <div className="bg-white border p-2 shadow rounded absolute w-full z-20">
                Loading...
              </div>
            )}
            {vlcOptions.length > 0 && (
              <div className="bg-white border shadow rounded max-h-40 overflow-y-auto absolute w-full z-20">
                {vlcOptions.map((asset) => (
                  <div
                    key={asset._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectAsset(asset)}
                  >
                    {asset.vlcCode} - {asset.vlcName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          {/* VLC Code and VLC Name */}
          <div>
            <Label>VLC Code</Label>
            <Input
              placeholder="e.g., 123456"
              type="text"
              value={formData.vlcCode !== undefined ? formData.vlcCode : ""}
              onChange={(e) => handleChange("vlcCode", e.target.value)}
            />
          </div>
          <div>
            <Label>VLC Name</Label>
            <Input
              placeholder="e.g., Vendor A"
              type="text"
              value={formData.vlcName !== undefined ? formData.vlcName : ""}
              onChange={(e) => handleChange("vlcName", e.target.value)}
            />
          </div>

          {/* Sr.No. and Stock No. */}
          <div>
            <Label>Sr.No.</Label>
            <Input
              placeholder="e.g., 1"
              type="text"
              min="0"
              value={formData.srNo !== undefined ? formData.srNo : ""}
              onChange={(e) => handleChange("srNo", e.target.value)}
            />
          </div>
          <div>
            <Label>Stock No.</Label>
            <Input
              placeholder="e.g., 1001"
              type="text"
              min="0"
              value={formData.stockNo !== undefined ? formData.stockNo : ""}
              onChange={(e) => handleChange("stockNo", e.target.value)}
            />
          </div>

          {/* RT and Duplicate */}
          <div>
            <Label>RT</Label>
            <Input
              placeholder="e.g., 1"
              type="number" // Changed to number
              min="0"
              value={formData.rt !== undefined ? formData.rt : ""}
              onChange={(e) => handleChange("rt", e.target.value)}
            />
          </div>
          <div>
            <Label>Duplicate</Label>
            <Input
              placeholder="e.g., 0"
              type="number" // Changed to number
              min="0"
              value={formData.duplicate !== undefined ? formData.duplicate : ""}
              onChange={(e) => handleChange("duplicate", e.target.value)}
            />
          </div>

          {/* Status and C Status */}
          <div>
            <Label>Status</Label>
            <Input
              placeholder="e.g., Running"
              type="text"
              value={formData.status !== undefined ? formData.status : ""}
              onChange={(e) => handleChange("status", e.target.value)}
            />
          </div>
          <div>
            <Label>C Status</Label>
            <Input
              placeholder=""
              type="text"
              value={formData.cStatus !== undefined ? formData.cStatus : ""}
              onChange={(e) => handleChange("cStatus", e.target.value)}
            />
          </div>

          {/* CAN (single field in a row) */}
          <div>
            <Label>CAN</Label>
            <Input
              placeholder="e.g., 123"
              type="number"
              min="0"
              value={formData.can !== undefined ? formData.can : ""}
              onChange={(e) => handleChange("can", e.target.value)}
            />
          </div>
          {/* Add an empty div to push the next field to the next row on md screens if CAN should truly be alone */}
          <div className="hidden md:block"></div>

          {/* LID and PVC */}
          <div>
            <Label>LID</Label>
            <Input
              placeholder="e.g., 456"
              type="number"
              min="0"
              value={formData.lid !== undefined ? formData.lid : ""}
              onChange={(e) => handleChange("lid", e.target.value)}
            />
          </div>
          <div>
            <Label>PVC</Label>
            <Input
              placeholder="e.g., 789"
              type="number"
              min="0"
              value={formData.pvc !== undefined ? formData.pvc : ""}
              onChange={(e) => handleChange("pvc", e.target.value)}
            />
          </div>

          {/* DPS and Keyboard */}
          <div>
            <Label>DPS</Label>
            <Input
              placeholder="e.g., DPS001"
              type="text"
              value={formData.dps !== undefined ? formData.dps : ""}
              onChange={(e) => handleChange("dps", e.target.value)}
            />
          </div>
          <div>
            <Label>Keyboard</Label>
            <Input
              placeholder="e.g., 0"
              type="number"
              min="0"
              value={formData.keyboard !== undefined ? formData.keyboard : ""}
              onChange={(e) => handleChange("keyboard", e.target.value)}
            />
          </div>

          {/* Printer and Charger */}
          <div>
            <Label>Printer</Label>
            <Input
              placeholder="e.g., 0"
              type="number"
              min="0"
              value={formData.printer !== undefined ? formData.printer : ""}
              onChange={(e) => handleChange("printer", e.target.value)}
            />
          </div>
          <div>
            <Label>Charger</Label>
            <Input
              placeholder="e.g., 0"
              type="number"
              min="0"
              value={formData.charger !== undefined ? formData.charger : ""}
              onChange={(e) => handleChange("charger", e.target.value)}
            />
          </div>

          {/* Stripper and Solar */}
          <div>
            <Label>Stripper</Label>
            <Input
              placeholder="e.g., 0"
              type="number"
              min="0"
              value={formData.stripper !== undefined ? formData.stripper : ""}
              onChange={(e) => handleChange("stripper", e.target.value)}
            />
          </div>
          <div>
            <Label>Solar</Label>
            <Input
              placeholder="e.g., 0"
              type="number"
              min="0"
              value={formData.solar !== undefined ? formData.solar : ""}
              onChange={(e) => handleChange("solar", e.target.value)}
            />
          </div>

          {/* Controller and EWS */}
          <div>
            <Label>Controler</Label>
            <Input
              placeholder="e.g., 1"
              type="number"
              min="0"
              value={
                formData.controller !== undefined ? formData.controller : ""
              }
              onChange={(e) => handleChange("controller", e.target.value)}
            />
          </div>
          <div>
            <Label>EWS</Label>
            <Input
              placeholder="e.g., 1"
              type="number"
              min="0"
              value={formData.ews !== undefined ? formData.ews : ""}
              onChange={(e) => handleChange("ews", e.target.value)}
            />
          </div>

          {/* Display and Battery */}
          <div>
            <Label>Display</Label>
            <Input
              placeholder="e.g., 1"
              type="number"
              min="0"
              value={formData.display !== undefined ? formData.display : ""}
              onChange={(e) => handleChange("display", e.target.value)}
            />
          </div>
          <div>
            <Label>Battery</Label>
            <Input
              placeholder="e.g., 12"
              type="number"
              min="0"
              value={formData.battery !== undefined ? formData.battery : ""}
              onChange={(e) => handleChange("battery", e.target.value)}
            />
          </div>

          {/* BOND and Vsp Sign */}
          <div>
            <Label>BOND</Label>
            <Input
              placeholder="e.g., BOND001"
              type="text"
              value={formData.bond !== undefined ? formData.bond : ""}
              onChange={(e) => handleChange("bond", e.target.value)}
            />
          </div>
          <div>
            <Label>Vsp Sign</Label>
            <Input
              placeholder="e.g., Signed"
              type="text"
              value={formData.vspSign !== undefined ? formData.vspSign : ""}
              onChange={(e) => handleChange("vspSign", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            {" "}
            {/* Button spans two columns on medium screens and up */}
            <Button className="my-8 w-full sm:w-40" onClick={handleSaveEntry}>
              {selectedAsset ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
