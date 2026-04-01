import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Select,
  Switch,
} from "antd";
import axios from "axios";

const { Option } = Select;

// Matches backend schema (remove department)
const defaultFormValues = {
  name: "",
  email: "",
  phone: "",
  // department: "", // removed
  role: "admin",
  status: "active",
  isDisabled: false,
};

type Admin = {
  _id: string;
  name: string;
  email: string;
  phone:string;
  role: string;
  status: "active" | "suspended" | "deleted";
  isDisabled: boolean;

};

const API = `${import.meta.env.VITE_API_URL}/api/super-admin/users/admins`;

// Helper to get auth token (from localStorage or customize as needed)
function getAuthHeader() {
  const token = localStorage.getItem("super-admin-token");
  return token
    ? {
        headers: { Authorization: `${token}` },
      }
    : {};
}

const OnboardAdmin: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form] = Form.useForm();

  // Fetch all admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, getAuthHeader());
      setAdmins(Array.isArray(res.data) ? res.data : []);
      console.log(res.data);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Failed to fetch admins."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Create or update admin (full PUT for edit, POST for create)
  const handleFinish = async (values: any) => {
    try {
      if (!("status" in values)) values.status = "active";
      if (!("isDisabled" in values)) values.isDisabled = false;

      // Only include name, email, status, isDisabled, phone
      const body = {
        name: values.name,
        email: values.email,
        status: values.status,
        isDisabled: values.isDisabled,
        phone: values.phone,
        // department: values.department, // removed
      };

      if (editing && editingAdmin) {
        // Full admin edit (PUT /admins/:id)
        await axios.put(`${API}/${editingAdmin._id}`, body, getAuthHeader());
        message.success("Admin details updated.");
      } else {
        // Create admin (POST /admins)
        await axios.post(API, body, getAuthHeader());
        message.success("Admin onboarded.");
      }
      setModalOpen(false);
      setEditingAdmin(null);
      setEditing(false);
      fetchAdmins();
      form.resetFields();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Operation failed. Please try again."
      );
    }
  };

  // Open form in add mode
  const openAddModal = () => {
    setEditing(false);
    setEditingAdmin(null);
    form.setFieldsValue(defaultFormValues);
    setModalOpen(true);
  };

  // Open form in edit mode, pre-fill values
  const openEditModal = (admin: Admin) => {
    setEditing(true);
    setEditingAdmin(admin);
    form.setFieldsValue({
      ...defaultFormValues,
      ...admin,
      phone: admin.phone || "",
      // department: admin?.adminProfile?.department || "", // removed
      status: admin.status ?? "active",
      isDisabled: admin.isDisabled ?? false,
    });
    setModalOpen(true);
  };

  // Delete admin (DELETE /admins/:id)
  const handleDelete = async (adminId: string) => {
    try {
      await axios.delete(`${API}/${adminId}`, getAuthHeader());
      message.success("Admin deleted.");
      fetchAdmins();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Could not delete admin."
      );
    }
  };

  // Patch status only (PATCH /admins/:id/status)
  const handleStatusChange = async (admin: Admin, newStatus: string) => {
    if (admin.status === newStatus) return;
    try {
      await axios.patch(
        `${API}/${admin._id}/status`,
        { status: newStatus },
        getAuthHeader()
      );
      message.success("Admin status updated.");
      fetchAdmins();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Could not update status."
      );
    }
  };

  // Patch disabled only (PATCH /admins/:id/disabled)
  const handleDisabledChange = async (admin: Admin, checked: boolean) => {
    if (admin.isDisabled === checked) return;
    try {
      await axios.patch(
        `${API}/${admin._id}/disabled`,
        { isDisabled: checked },
        getAuthHeader()
      );
      message.success("Admin disabled flag updated.");
      fetchAdmins();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Could not update disabled flag."
      );
    }
  };

  // Table columns (remove Department)
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_: any, rec: Admin) => rec.name,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (_: any, rec: Admin) => rec.email,
    },
    {
      title: "Phone",
      dataIndex: ["adminProfile", "phone"],
      key: "phone",
      render: (_: any, rec: Admin) => rec?.phone || "",
    },
    // Department column removed
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: any, rec: Admin) => (
        <Select
          style={{ width: 120 }}
          value={rec.status}
          onChange={(val) => handleStatusChange(rec, val)}
          size="small"
        >
          <Option value="active">Active</Option>
          <Option value="suspended">Suspended</Option>
          <Option value="deleted">Deleted</Option>
        </Select>
      ),
    },
    {
      title: "Disabled",
      dataIndex: "isDisabled",
      key: "isDisabled",
      render: (_: any, rec: Admin) => (
        <Switch
          checked={rec.isDisabled}
          checkedChildren="Yes"
          unCheckedChildren="No"
          onChange={(checked) => handleDisabledChange(rec, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, rec: Admin) => (
        <>
          <Button
            type="link"
            onClick={() => openEditModal(rec)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this admin?"
            onConfirm={() => handleDelete(rec._id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-row justify-between items-center pb-4">
        <h2 className="text-xl font-bold">Manage Admins</h2>
        <Button type="primary" onClick={openAddModal}>
          Onboard Admin
        </Button>
      </div>
      <Table
        dataSource={admins}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
      <Modal
        open={modalOpen}
        title={editing ? "Edit Admin" : "Onboard Admin"}
        onCancel={() => {
          setModalOpen(false);
          setEditing(false);
          setEditingAdmin(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editing ? "Update" : "Create"}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultFormValues}
          onFinish={handleFinish}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Name is required." },
              { min: 2 },
            ]}
          >
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Email is required.",
                type: "email",
              },
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              {
                pattern: /^[0-9]{10,15}$/,
                message: "Enter valid phone number.",
              },
            ]}
          >
            <Input placeholder="Phone number" />
          </Form.Item>
          {/* Department field removed */}
          <Form.Item
            label="Status"
            name="status"
            rules={[
              { required: true, message: "Status is required." },
              { type: "string" },
            ]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="suspended">Suspended</Option>
              <Option value="deleted">Deleted</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Disabled"
            name="isDisabled"
            valuePropName="checked"
            help="If checked, admin cannot log in or perform actions."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          {/* Always set role=admin, hidden */}
          <Form.Item name="role" initialValue="admin" hidden>
            <Input type="hidden" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OnboardAdmin;