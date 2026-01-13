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
  { label: "Patient ID", key: "patientId" },
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
