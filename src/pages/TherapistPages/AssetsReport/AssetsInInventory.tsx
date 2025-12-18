import { useState, useEffect } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import axios from "axios";

// ---------------- TYPES ----------------
interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "info";
  title: string;
  message: string;
}

interface AssetReport {
  _id?: string;
  subAdminId: string;
  stockNo?: string;
  rt?: string;
  duplicate?: string;
  status?: string;
  cStatus?: string;
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
  vspSign?: string;
  dps?: string;
}

// ---------------- COMPONENT ----------------
export default function AssetsInInventory() {
  const API_URL = import.meta.env.VITE_API_URL;
  const subAdminId = localStorage.getItem("sub-admin-id") || "";

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState<AssetReport>({ subAdminId });
  const [usedAssets, setUsedAssets] = useState<AssetReport>({ subAdminId });
  const [loading, setLoading] = useState(false);

  // Load sub-admin asset report on mount
  useEffect(() => {
    const fetchAssetReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/sub-admin/get-issued-assets-report`,
          {
            headers: { Authorization: localStorage.getItem("sub-admin-token") },
          }
        );

        if (res.data?.data) {
          setFormData(res.data.data);
          setUsedAssets(res.data.usedAssets);
        }
      } catch (error) {
        console.error("Error fetching asset report:", error);
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

  if (loading && !formData.stockNo)
    return <p className="p-4 text-gray-500">Loading asset data...</p>;

  // Grouped asset categories
  const groupedAssets = [
    {
      title: "Core Equipment",
      fields: ["can", "lid", "pvc", "keyboard", "printer", "charger"],
      type: "inventory",
    },
    {
      title: "Support Equipment",
      fields: [
        "stripper",
        "solar",
        "controller",
        "ews",
        "display",
        "battery",
        "rt",
        "duplicate",
      ],
      type: "inventory",
    },
    {
      title: "Identifiers",
      fields: ["bond", "dps"],
      type: "tags",
    },
    {
      title: "Status Information",
      fields: ["status", "cStatus", "vspSign"],
      type: "text",
    },
  ];

  return (
    <ComponentCard
      title="Your Issued Assets"
      className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
    >
      {alert.isEnable && (
        <Alert
          variant={alert.variant as any}
          title={alert.title}
          message={alert.message}
        />
      )}

      <div className="space-y-8">
        {groupedAssets.map((group) => (
          <div key={group.title}>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">
              {group.title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.fields.map((field) => {
                const valueForm = formData[field as keyof AssetReport];
                const valueUsed = usedAssets[field as keyof AssetReport];

                // Inventory Fields (show progress bar)
                if (group.type === "inventory") {
                  const used = Number(valueUsed) || 0;
                  const total = Number(valueForm) || 0;
                  const percentage =
                    total > 0 ? Math.min((used / total) * 100, 100) : 0;

                  return (
                    <div
                      key={field}
                      className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition"
                    >
                      <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {field.toUpperCase()}
                      </Label>

                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-blue-600 dark:text-blue-400">
                          {used}
                        </span>
                        <span className="text-gray-400">/ {total}</span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            percentage < 60
                              ? "bg-green-500"
                              : percentage < 90
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }

                // Tags (Bond / DPS)
                // Tags (Bond / DPS)
                if (group.type === "tags") {
                  const usedItems = (valueUsed as string)
                    ?.split(",")
                    .map((s) => s.trim())
                    .filter((s) => s);
                  const totalItems = (valueForm as string)
                    ?.split(",")
                    .map((s) => s.trim())
                    .filter((s) => s);

                  return (
                    <div
                      key={field}
                      className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition"
                    >
                      <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {field.toUpperCase()}
                      </Label>

                      {/* Used Items */}
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-red-500 dark:text-red-400 mb-1">
                          Used
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {usedItems && usedItems.length > 0 ? (
                            usedItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              No used items
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Total / Available Items */}
                      <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                          Total
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {totalItems && totalItems.length > 0 ? (
                            totalItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              No total items
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Text Fields (Status, cStatus, VSP Sign)
                return (
                  <div
                    key={field}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition"
                  >
                    <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {field.toUpperCase()}
                    </Label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {valueForm || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ComponentCard>
  );
}
