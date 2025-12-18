import { useEffect, useState } from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import ComponentCard from "../../../components/common/ComponentCard";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import axios from "axios";

interface RouteType {
  _id: string;
  route: string | number;
  createdAt: string;
  updatedAt: string;
}

interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

const HandleRoutes = () => {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [routeValue, setRouteValue] = useState<string>("");
  const [editRouteId, setEditRouteId] = useState<string | null>(null);
  const [editRouteValue, setEditRouteValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false,
    variant: "info",
    title: "",
    message: "",
  });

  const fetchRoutes = async () => {
    setLoading(true);
    setAlert({ isEnable: false, variant: "info", title: "", message: "" });
    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/get-all-routes`,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setRoutes(res.data.routes);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Unable to fetch routes. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAddRoute = async () => {
    setAlert({ isEnable: false, variant: "info", title: "", message: "" });
    if (!routeValue.trim()) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Input Required",
        message: "Please enter a Route value.",
      });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/add-route`,
        { route: routeValue },
        { headers: { Authorization: `${token}`, "Content-Type": "application/json" } }
      );
      setAlert({
        isEnable: true,
        variant: "success",
        title: "Route Added",
        message: res.data.message || "Route successfully added.",
      });
      setRouteValue("");
      fetchRoutes();
    } catch (error: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Add Route Failed",
        message:
          error?.response?.data?.message ||
          "Unable to add Route. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (route: RouteType) => {
    setEditRouteId(route._id);
    setEditRouteValue(`${route.route}`);
    setAlert({ isEnable: false, variant: "info", title: "", message: "" });
  };

  const handleEditRoute = async () => {
    if (!editRouteValue.trim()) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Input Required",
        message: "Please enter a Route value to update.",
      });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/edit-route/${editRouteId}`,
        { route: editRouteValue },
        { headers: { Authorization: `${token}`, "Content-Type": "application/json" } }
      );
      setAlert({
        isEnable: true,
        variant: "success",
        title: "Route Updated",
        message: res.data.message || "Route updated successfully.",
      });
      setEditRouteId(null);
      setEditRouteValue("");
      fetchRoutes();
    } catch (error: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Unable to update route. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/delete-route/${routeId}`,
        { headers: { Authorization: `${token}` } }
      );
      setAlert({
        isEnable: true,
        variant: "success",
        title: "Route Deleted",
        message: res.data.message || "Route deleted successfully.",
      });
      fetchRoutes();
    } catch (error: any) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Delete Failed",
        message:
          error?.response?.data?.message ||
          "Unable to delete route. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manage Routes" />
      <ComponentCard title="Add New Route">
        {alert.isEnable && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        )}

        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <Label>Route</Label>
            <Input
              type="text"
              placeholder="Enter new route (text or number)"
              name="route"
              value={routeValue}
              onChange={e => setRouteValue(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleAddRoute} disabled={loading}>
            Add Route
          </Button>
        </div>
      </ComponentCard>

      <ComponentCard title="Existing Routes">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y text-center divide-gray-200 text-sm">
            <thead className="text-center">
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 text-left font-medium text-gray-700">Route</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Created At</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {routes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                    {loading ? "Loading..." : "No routes found."}
                  </td>
                </tr>
              )}
              {routes.map((route) => (
                <tr key={route._id}>
                  <td className="px-4 py-2 text-2xl ">
                    {editRouteId === route._id ? (
                      <Input
                        type="text"
                        value={editRouteValue}
                        onChange={e => setEditRouteValue(e.target.value)}
                        className="min-w-[120px]"
                        disabled={loading}
                      />
                    ) : (
                      route.route
                    )}
                  </td>
                  <td className="px-4 py-2">{new Date(route.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {editRouteId === route._id ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleEditRoute}
                          disabled={loading}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"

                          onClick={() => {
                            setEditRouteId(null);
                            setEditRouteValue("");
                          }}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEditClick(route)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"

                          onClick={() => handleDeleteRoute(route._id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
};

export default HandleRoutes;
