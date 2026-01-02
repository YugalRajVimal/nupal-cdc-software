import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spin, Table, Typography, message } from "antd";
const { Title } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface ChildType {
  _id: string;
  name: string;
  patientId?: string;
  gender?: string;
  childDOB?: string;
  fatherFullName?: string;
  plannedSessionsPerMonth?: string;
  package?: string;
  motherFullName?: string;
  parentEmail?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  areaName?: string;
  diagnosisInfo?: string;
  childReference?: string;
  parentOccupation?: string;
  remarks?: string;
  otherDocument?: any;
}

const MyChildrens: React.FC = () => {
  const [children, setChildren] = useState<ChildType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/parent/childrens`)
      .then((res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setChildren(res.data.data);
        } else {
          setChildren([]);
          message.error("Failed to fetch children data.");
        }
      })
      .catch(() => {
        message.error("Error fetching children data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: "Child Name", dataIndex: "name", key: "name" },
    { title: "Patient ID", dataIndex: "patientId", key: "patientId" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "DOB", dataIndex: "childDOB", key: "childDOB" },
    { title: "Father Name", dataIndex: "fatherFullName", key: "fatherFullName" },
    { title: "Mother Name", dataIndex: "motherFullName", key: "motherFullName" },
    { title: "Mobile 1", dataIndex: "mobile1", key: "mobile1" },
    { title: "Mobile 2", dataIndex: "mobile2", key: "mobile2" },
    { title: "Package", dataIndex: "package", key: "package" },
    { title: "Parent Email", dataIndex: "parentEmail", key: "parentEmail" },
    { title: "Address", dataIndex: "address", key: "address" },
    // Add more columns as needed
  ];

  return (
    <Card style={{ margin: 32 }}>
      <Title level={3}>My Children</Title>
      <Spin spinning={loading}>
        <Table
          dataSource={children.map((child) => ({ ...child, key: child._id }))}
          columns={columns}
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText: loading ? "Loading children..." : "No children found."
          }}
          scroll={{ x: true }}
        />
      </Spin>
    </Card>
  );
};

export default MyChildrens;
