import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Spin,
  Typography,
  Descriptions,
  Row,
  Col,
  Divider,
  Tag,
  message,
  Button,
  Modal,
  Form,
  Input,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface ParentDetails {
  _id: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

interface ChildrenDetails {
  _id: string;
  name?: string;
  patientId?: string;
  gender?: string;
  childDOB?: string;
  motherFullName?: string;
  fatherFullName?: string;
  diagnosisInfo?: string;
  mobile1?: string;
  address?: string;
  package?: string;
  [key: string]: any;
}

interface ParentProfileAPIResponse {
  parent: ParentDetails;
  childrens: ChildrenDetails[];
}

const PARENT_KEYS: { label: string; key: keyof ParentDetails }[] = [
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Phone", key: "phone" },
  { label: "Status", key: "status" },
  { label: "Joined On", key: "createdAt" },
];

const CHILD_KEYS: { label: string; key: keyof ChildrenDetails }[] = [
  { label: "Name", key: "name" },
  { label: "Children ID", key: "patientId" },
  { label: "Gender", key: "gender" },
  { label: "DOB", key: "childDOB" },
  { label: "Diagnosis", key: "diagnosisInfo" },
  { label: "Father", key: "fatherFullName" },
  { label: "Mother", key: "motherFullName" },
  { label: "Mobile", key: "mobile1" },
  { label: "Address", key: "address" },
];

const ParentProfile: React.FC = () => {
  const [profile, setProfile] = useState<ParentProfileAPIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset password modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    const patientToken = localStorage.getItem("patient-token");
    axios
      .get(`${API_BASE_URL}/api/parent/profile`, {
        headers: {
          ...(patientToken ? { Authorization: `${patientToken}` } : {}),
        },
      })
      .then((res) => {
        if (res.data && res.data.success && res.data.data) {
          setProfile(res.data.data);
        } else {
          setProfile(null);
          message.error("Failed to fetch profile data.");
        }
      })
      .catch(() => {
        setProfile(null);
        message.error("Error fetching profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordReset = (values: { newPassword: string }) => {
    setResetLoading(true);
    const patientToken = localStorage.getItem("patient-token");
    axios
      .post(
        `${API_BASE_URL}/api/auth/reset-password`,
        { newPassword: values.newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            ...(patientToken ? { Authorization: `${patientToken}` } : {}),
          },
        }
      )
      .then((res) => {
        if (res.status === 200 && res.data && res.data.message) {
          message.success("Password reset successfully.");
          setIsModalOpen(false);
          form.resetFields();
        } else {
          message.error(res.data?.message || "Failed to reset password.");
        }
      })
      .catch((err) => {
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password.";
        message.error(errMsg);
      })
      .finally(() => setResetLoading(false));
  };

  function renderParent(profile: ParentDetails) {
    return (
      <Descriptions
        bordered
        size="middle"
        column={1}
        style={{ marginBottom: 22, background: "#fff", borderRadius: 12, overflow: "hidden" }}
        labelStyle={{ width: 130 }}
        className="!rounded-lg"
      >
        {PARENT_KEYS.map((item) => (
          <Descriptions.Item label={item.label} key={item.key}>
            {item.key === "createdAt"
              ? profile[item.key]
                ? dayjs(profile[item.key]).format("DD MMM, YYYY")
                : "-"
              : item.key === "status"
              ? (
                <Tag color={profile.status === "active" ? "green" : "red"}>
                  {profile[item.key]?.charAt(0).toUpperCase() +
                    (profile[item.key]?.slice(1) || "")}
                </Tag>
              )
              : profile[item.key] || "-"}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  }

  function renderChild(child: ChildrenDetails) {
    return (
      <Card
        key={child._id}
        type="inner"
        bordered
        title={
          <span>
            {child.name}
            {child.patientId && (
              <Tag color="geekblue" style={{ marginLeft: 8 }}>
                {child.patientId}
              </Tag>
            )}
          </span>
        }
        style={{
          marginBottom: 18,
          borderRadius: 8,
          background: "#fafcff",
        }}
        bodyStyle={{ padding: 14 }}
      >
        <Descriptions column={1} size="small">
          {CHILD_KEYS.map((item) => {
            let value = child[item.key];
            if (item.key === "childDOB" && value) {
              value = dayjs(value as string).format("DD MMM, YYYY");
            }
            return (
              <Descriptions.Item label={item.label} key={item.key}>
                {value ? value : <span style={{ color: "#bbb" }}>-</span>}
              </Descriptions.Item>
            );
          })}
        </Descriptions>
      </Card>
    );
  }

  return (
    <Spin spinning={loading}>
      <div
        style={{
          margin: "40px auto 32px auto",
        }}

      >
        <Title level={3} style={{ marginBottom: 6 }}>
          Parent Profile Details
        </Title>
        <Divider style={{ margin: "12px 0 18px 0" }} />

        {profile ? (
          <>
            {renderParent(profile.parent)}
            <div style={{ textAlign: "right", marginBottom: 14 }}>
              <Button
                type="primary"
                onClick={() => setIsModalOpen(true)}
                style={{ minWidth: 180 }}
              >
                Reset Password
              </Button>
            </div>
            <Divider style={{ marginTop: 0, marginBottom: 12 }}>
              <Title level={4} style={{ margin: 0 }}>
                Children{profile.childrens && profile.childrens.length ? ` (${profile.childrens.length})` : ""}
              </Title>
            </Divider>
            {profile.childrens && profile.childrens.length > 0 ? (
              <Row gutter={[16, 16]}>
                {profile.childrens.map((child) => (
                  <Col xs={24} sm={12} md={8} lg={8} key={child._id}>
                    {renderChild(child)}
                  </Col>
                ))}
              </Row>
            ) : (
              <Text type="secondary">No children linked to this parent.</Text>
            )}

            <Modal
              title="Reset Password"
              open={isModalOpen}
              onCancel={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}
              footer={null}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handlePasswordReset}
                autoComplete="off"
              >
                <Form.Item
                  label="New Password"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Please input new password!" },
                    { min: 6, message: "Password must be at least 6 characters." },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="Enter new password" autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  label="Confirm New Password"
                  name="confirmNewPassword"
                  dependencies={["newPassword"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Please confirm new password!" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("The two passwords do not match!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm new password" autoComplete="new-password" />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={resetLoading}
                    style={{ marginTop: 4 }}
                  >
                    Reset Password
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </>
        ) : (
          !loading && (
            <Text type="secondary">No profile data found.</Text>
          )
        )}
      </div>
    </Spin>
  );
};

export default ParentProfile;
