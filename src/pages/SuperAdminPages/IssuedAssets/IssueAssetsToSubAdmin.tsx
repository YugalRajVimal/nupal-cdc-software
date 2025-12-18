// import { useState, useEffect } from "react";
// import ComponentCard from "../../../components/common/ComponentCard";
// import Input from "../../../components/form/input/InputField";
// import Label from "../../../components/form/Label";
// import Button from "../../../components/ui/button/Button";
// import Alert from "../../../components/ui/alert/Alert";
// import axios from "axios";
// import { useLocation } from "react-router";

// interface AlertState {
//   isEnable: boolean;
//   variant: "success" | "error" | "warning" | "info";
//   title: string;
//   message: string;
// }

// interface AssetReport {
//   _id?: string;
//   subAdminId: string;
//   rt?: string;
//   duplicate?: string;
//   can?: number | string;
//   lid?: number | string;
//   pvc?: number | string;
//   keyboard?: number | string;
//   printer?: number | string;
//   charger?: number | string;
//   stripper?: number | string;
//   solar?: number | string;
//   controller?: number | string;
//   ews?: number | string;
//   display?: number | string;
//   battery?: number | string;
//   bond?: string;
//   dps?: string;
// }

// export default function IssueAssetsToSubAdmin() {
//   const location = useLocation();
//   const subAdminId = location.state?.subAdminId;

//   const API_URL = import.meta.env.VITE_API_URL;

//   const [alert, setAlert] = useState<AlertState>({
//     isEnable: false,
//     variant: "info",
//     title: "",
//     message: "",
//   });

//   const [formData, setFormData] = useState<AssetReport>({ subAdminId });
//   const [usedAssetsOfSubAdmin, setUsedAssetsOfSubAdmin] = useState<AssetReport>({ subAdminId });
//   const [selectedAsset, setSelectedAsset] = useState<AssetReport | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchAssetReport = async () => {
//       if (!subAdminId) return;

//       setLoading(true);
//       try {
//         const res = await axios.get(`${API_URL}/api/admin/get-issued-assets-report`, {
//           params: { subAdminId },
//           headers: { Authorization: localStorage.getItem("admin-token") },
//         });

//         const existingAsset = res.data?.data;

//         if (existingAsset) {
//           setSelectedAsset(existingAsset);
//           setFormData(existingAsset);
//           setUsedAssetsOfSubAdmin(res.data?.usedAssetsOfSubAdmin);
//         } else {
//           setSelectedAsset(null);
//           setFormData({ subAdminId });
//         }
//       } catch (error) {
//         console.error("Error fetching asset report:", error);
//         setAlert({ isEnable: true, variant: "error", title: "Error", message: "Failed to load asset report." });
//         setSelectedAsset(null);
//         setFormData({ subAdminId });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAssetReport();
//   }, [subAdminId, API_URL]);

//   const handleChange = (field: keyof AssetReport, value: string) => {
//     const numericFields = [
//       "rt","duplicate","can","lid","pvc","keyboard","printer","charger",
//       "stripper","solar","controller","ews","display","battery"
//     ];

//     setFormData(prev => ({
//       ...prev,
//       [field]: numericFields.includes(field) ? (value === "" ? "" : Number(value)) : value
//     }));
//   };

//   const handleSaveEntry = async () => {
//     setLoading(true);
//     try {
//       const dataToSend = { ...formData, subAdminId };
//       let res;

//       if (selectedAsset && selectedAsset._id) {
//         res = await axios.post(`${API_URL}/api/admin/update-issued-assets`, dataToSend, {
//           headers: { Authorization: localStorage.getItem("admin-token") },
//         });
//         setAlert({ isEnable: true, variant: "success", title: "Success", message: "Issued Asset updated successfully ✅" });
//       } else {
//         res = await axios.post(`${API_URL}/api/admin/add-issued-assets`, dataToSend, {
//           headers: { Authorization: localStorage.getItem("admin-token") },
//         });
//         setAlert({ isEnable: true, variant: "success", title: "Success", message: "Assets Issued successfully ✅" });
//       }

//       setSelectedAsset(res.data.data);
//       setFormData(res.data.data);
//     } catch (error: any) {
//       console.error("Save error:", error);
//       setAlert({ isEnable: true, variant: "error", title: "Error", message: error?.response?.data?.message || "Failed to save asset" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading && !selectedAsset) return <p className="p-4 text-gray-500">Loading asset data...</p>;

//   // Grouped layout
//   const numericFields = [
//     "rt","duplicate","can","lid","pvc","keyboard","printer","charger",
//     "stripper","solar","controller","ews","display","battery"
//   ];

//   return (
//     <ComponentCard title="Manage Issued Assets" className="mt-4 relative">
//       {alert.isEnable && <Alert variant={alert.variant as any} title={alert.title} message={alert.message} />}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
//         <div className="md:col-span-2">
//           <Label>SubAdmin ID</Label>
//           <Input type="text" value={subAdminId} disabled className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
//         </div>

//         {/* Numeric fields */}
//         {numericFields.map(field => {
//           const used = usedAssetsOfSubAdmin[field as keyof AssetReport] || 0;
//           const total = formData[field as keyof AssetReport] || 0;
//           const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

//           return (
//             <div key={field} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition">
//               <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
//                 {field.toUpperCase()} (Used: {used} / Total: {total})
//               </Label>

//               <Input
//                 type="number"
//                 min={0}
//                 placeholder="0"
//                 value={formData[field as keyof AssetReport] || ""}
//                 onChange={e => handleChange(field as keyof AssetReport, e.target.value)}
//               />

//               {/* Progress bar */}
//               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
//                 <div
//                   className={`h-2 rounded-full ${percentage < 60 ? "bg-green-500" : percentage < 90 ? "bg-yellow-500" : "bg-red-500"}`}
//                   style={{ width: `${percentage}%` }}
//                 ></div>
//               </div>
//             </div>
//           );
//         })}

//         {/* Bond & DPS */}
//         {["bond","dps"].map(field => {
//           const used = usedAssetsOfSubAdmin[field as keyof AssetReport] || "-";
//           const total = formData[field as keyof AssetReport] || "-";
//           return (
//             <div key={field} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition">
//               <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
//                 {field.toUpperCase()} (Used: {used} / Total: {total})
//               </Label>
//               <Input
//                 type="text"
//                 placeholder={`e.g., ${field.toUpperCase()}001`}
//                 value={formData[field as keyof AssetReport] || ""}
//                 onChange={e => handleChange(field as keyof AssetReport, e.target.value)}
//               />
//             </div>
//           );
//         })}

//         <div className="md:col-span-2">
//           <Button className="my-8 w-full sm:w-40" onClick={handleSaveEntry} disabled={loading}>
//             {loading ? "Saving..." : selectedAsset ? "Update Entry" : "Save Entry"}
//           </Button>
//         </div>
//       </div>
//     </ComponentCard>
//   );
// }

// ...imports remain same
import { useState, useEffect } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import axios from "axios";
import { useLocation } from "react-router";

interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface AssetReport {
  _id?: string;
  subAdminId: string;
  rt?: string;
  duplicate?: string;
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
  bond?: string;
  dps?: string;
}

export default function IssueAssetsToSubAdmin() {
  const location = useLocation();
  const subAdminId: string = location.state?.subAdminId || "";

  const API_URL = import.meta.env.VITE_API_URL;

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState<AssetReport>({ subAdminId });
  const [usedAssetsOfSubAdmin, setUsedAssetsOfSubAdmin] = useState<AssetReport>(
    { subAdminId }
  );
  const [selectedAsset, setSelectedAsset] = useState<AssetReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const numericFields: (keyof AssetReport)[] = [
    "rt",
    "duplicate",
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
  ];

  const textFields: (keyof AssetReport)[] = ["bond", "dps"];

  useEffect(() => {
    const fetchAssetReport = async () => {
      if (!subAdminId) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/admin/get-issued-assets-report`,
          {
            params: { subAdminId },
            headers: {
              Authorization: localStorage.getItem("admin-token") || "",
            },
          }
        );

        const existingAsset: AssetReport = res.data?.data || null;
        const usedAssets: AssetReport = res.data?.usedAssetsOfSubAdmin || {
          subAdminId,
        };

        if (existingAsset) {
          setSelectedAsset(existingAsset);
          setFormData(existingAsset);
          setUsedAssetsOfSubAdmin(usedAssets);
        }
      } catch (error) {
        console.error(error);
        setAlert({
          isEnable: true,
          variant: "error",
          title: "Error",
          message: "Failed to load asset report.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssetReport();
  }, [subAdminId, API_URL]);

  const handleChange = (field: keyof AssetReport, value: string) => {
    if (numericFields.includes(field)) {
      setFormData((prev) => ({
        ...prev,
        [field]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateBeforeSave = (): boolean => {
    for (const field of numericFields) {
      const used = Number(usedAssetsOfSubAdmin[field] || 0);
      const newValue = Number(formData[field] || 0);
      if (newValue < used) {
        setAlert({
          isEnable: true,
          variant: "error",
          title: "Validation Error",
          message: `Cannot set ${field.toUpperCase()} below already used value (${used})`,
        });
        return false;
      }
    }

    for (const field of textFields) {
      const used: string[] = ((usedAssetsOfSubAdmin[field] as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const newValue: string[] = ((formData[field] as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const removedItems = used.filter((item) => !newValue.includes(item));
      if (removedItems.length > 0) {
        setAlert({
          isEnable: true,
          variant: "error",
          title: "Validation Error",
          message: `Cannot remove used ${field.toUpperCase()} value(s): ${removedItems.join(
            ", "
          )}`,
        });
        return false;
      }
    }

    return true;
  };

  const handleSaveEntry = async () => {
    if (!validateBeforeSave()) return;
    setLoading(true);
    try {
      const dataToSend = { ...formData, subAdminId };
      let res;

      if (selectedAsset && selectedAsset._id) {
        res = await axios.post(
          `${API_URL}/api/admin/update-issued-assets`,
          dataToSend,
          {
            headers: {
              Authorization: localStorage.getItem("admin-token") || "",
            },
          }
        );
        setAlert({
          isEnable: true,
          variant: "success",
          title: "Success",
          message: "Issued Asset updated successfully ✅",
        });
      } else {
        res = await axios.post(
          `${API_URL}/api/admin/add-issued-assets`,
          dataToSend,
          {
            headers: {
              Authorization: localStorage.getItem("admin-token") || "",
            },
          }
        );
        setAlert({
          isEnable: true,
          variant: "success",
          title: "Success",
          message: "Assets Issued successfully ✅",
        });
      }

      setSelectedAsset(res.data.data);
      setFormData(res.data.data);
    } catch (error: any) {
      console.error("Save error:", error);
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to save asset",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedAsset)
    return <p className="p-4 text-gray-500">Loading asset data...</p>;

  return (
    <ComponentCard title="Manage Issued Assets" className="mt-4 relative">
      {alert.isEnable && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
        />
      )}

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="md:col-span-2">
          <Label>SubAdmin ID</Label>
          <Input
            type="text"
            value={subAdminId}
            disabled

            className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
          />
        </div>

        {numericFields.map((field) => {
          const used = Number(usedAssetsOfSubAdmin[field] || 0);
          const total = Number(formData[field] || 0);
          const percentage =
            total > 0 ? Math.min((used / total) * 100, 100) : 0;

          return (
            <div
              key={field}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition"
            >
              <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {field.toUpperCase()} (Used: {used} / Total: {total})
              </Label>
              <Input
                type="number"
                // min={0}
                value={formData[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
              />
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    percentage < 60
                      ? "bg-green-500"
                      : percentage < 90
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {textFields.map((field) => {
          const used = usedAssetsOfSubAdmin[field] || "-";
          const total = formData[field] || "-";
          return (
            <div
              key={field}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition"
            >
              
              <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {field.toUpperCase()} (Used: {used} / Total: {total})
              </Label>
              <Input
                type="text"
                value={formData[field] || ""}
                placeholder={`e.g., ${field.toUpperCase()}001`}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </div>
          );
        })}

        <div className="md:col-span-2">
          <Button
            className="my-8 w-full sm:w-40"
            onClick={handleSaveEntry}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : selectedAsset
              ? "Update Entry"
              : "Save Entry"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
