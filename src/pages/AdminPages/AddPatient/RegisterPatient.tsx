import { useState, ChangeEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Context: for integration with patient-admin.routes.js and patient.controller.js, 
// we (1) require sending data that matches the backend expectation, (2) handle backend errors including duplicate user/email and validation, 
// (3) manage typical REST errors (status codes, backend errors returned as JSON/message).

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const steps = ["Personal", "Extra Details", "Review"];

// Must match backend DTO/interface from controller expectations.
interface FormDataState {
  email: string;
  childFullName: string;
  gender: string;
  childDOB: string; // Always stored as 'dd/mm/yyyy' in the frontend state
  fatherFullName: string;
  motherFullName: string;
  parentEmail: string;
  mobile1: string;
  mobile2: string;
  address: string;
  areaName: string;
  pincode: string;
  diagnosisInfo: string;
  childReference: string;
  parentOccupation: string;
  remarks: string;
  otherDocument?: File;
  profilePhoto?: File;
}

interface DetailProps {
  label: string;
  value: string | undefined;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  as?: "input" | "textarea";
  rows?: number;
  required?: boolean;
}

interface FileProps {
  label: string;
  onChange: (file: File) => void;
  required?: boolean;
}

const mandatoryFields: (keyof FormDataState)[] = [
  "email",
  "childFullName",
  "gender",
  "childDOB",
  "fatherFullName",
  "motherFullName",
  "parentEmail",
  "mobile1",
  "address",
  "areaName",
  "pincode",
  "diagnosisInfo",
  "childReference",
  "parentOccupation",
];

// --- Date utilities for DD/MM/YYYY (frontend only) ---
function formatToDisplayDate(ddmmyyyy: string | undefined): string {
  // In this frontend, stored date is always in dd/mm/yyyy, so we just return as is (or blank)
  if (!ddmmyyyy) return "";
  // Optionally, could validate format
  return ddmmyyyy;
}

// Converts Date to 'dd/mm/yyyy' for frontend display/state
function dateToDDMMYYYY(d: Date | null | undefined): string {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Converts 'dd/mm/yyyy' string to Date
function ddmmyyyyToDate(s: string): Date | null {
  if (!s) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(date.getTime())) return null;
  return date;
}

// Converts 'dd/mm/yyyy' string to 'yyyy-mm-dd' for backend
function ddmmyyyyToISO(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  if (!yyyy || !mm || !dd) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export default function PatientRegistration() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormDataState>({
    email: "",
    childFullName: "",
    gender: "",
    childDOB: "",
    fatherFullName: "",
    motherFullName: "",
    parentEmail: "",
    mobile1: "",
    mobile2: "",
    address: "",
    areaName: "",
    pincode: "",
    diagnosisInfo: "",
    childReference: "",
    parentOccupation: "",
    remarks: "",
    otherDocument: undefined,
    profilePhoto: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const update = (key: keyof FormDataState, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // For required fields: returns which are missing
  const missingFields = () => {
    return mandatoryFields.filter((field) => {
      const value = formData[field];
      return value === undefined || value === null || value === "";
    });
  };

  const canProceed = () => {
    if (step === 1) {
      return mandatoryFields
        .filter(
          (f) =>
            [
              "email",
              "childFullName",
              "gender",
              "childDOB",
              "fatherFullName",
              "motherFullName",
              "parentEmail",
              "mobile1",
              "address",
              "areaName",
              "pincode",
              "diagnosisInfo",
              "childReference",
              "parentOccupation",
            ].includes(f)
        )
        .every(
          (field) =>
            formData[field] &&
            (typeof formData[field] !== "string" ||
              (formData[field] as string).trim() !== "")
        );
    }
    return true;
  };

  const submit = async () => {
    setShowErrors(true);
    const missing = missingFields();
    if (missing.length > 0) {
      toast.error("Please fill all mandatory fields.", { position: "top-right" });
      return;
    }

    setSubmitting(true);

    try {
      // Prepare multipart/form-data, sending files with other fields
      const form = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (key === "profilePhoto" || key === "otherDocument") {
          form.append(key, value as Blob);
        } else if (key === "childDOB") {
          // Convert from 'dd/mm/yyyy' to ISO for backend
          form.append(key, ddmmyyyyToISO(value as string));
        } else {
          form.append(key, String(value));
        }
      });

      const authToken = localStorage.getItem("admin-token");
      const response = await fetch(`${API_BASE_URL}/api/admin/patients`, {
        method: "POST",
        body: form,
        headers: {
          ...(authToken ? { Authorization: authToken } : {}),
        },
      });

      // Handle backend response
      const contentType = response.headers.get('Content-Type');
      let errorMsg = "";
      let errorObj: any = {};
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMsg = data.message || response.statusText;
          errorObj = data;
        } else {
          errorMsg = await response.text();
        }

        if (errorMsg.toLowerCase().includes("duplicate")) {
          toast.error("A patient with this email already exists.", { position: "top-right" });
        } else if (errorObj.errors && typeof errorObj.errors === "object") {
          const firstError = Object.values(errorObj.errors)[0];
          if (typeof firstError === "string") {
            toast.error(firstError, { position: "top-right" });
          } else if (firstError && typeof firstError === "object" && "message" in firstError) {
            toast.error((firstError as any).message, { position: "top-right" });
          } else {
            toast.error("Validation error. Please check fields.", { position: "top-right" });
          }
        } else {
          toast.error("Failed to register child: " + errorMsg, { position: "top-right" });
        }
        setSubmitting(false);
        return;
      }

      toast.success("Child registered successfully", { position: "top-right" });
      // Optionally, reset form or redirect here.
    } catch (error: any) {
      toast.error("Registration failed: " + (error?.message || error), { position: "top-right" });
    }
    setSubmitting(false);
  };

  // Highlighting for missing required input fields
  const shouldShowError = (field: keyof FormDataState) =>
    showErrors &&
    mandatoryFields.includes(field) &&
    (
      !formData[field] ||
      (typeof formData[field] === "string" && formData[field].trim() === "")
    );

  const handleNext = () => {
    setShowErrors(true);
    if (!canProceed()) {
      toast.error("Please fill all mandatory fields before proceeding.", { position: "top-right" });
      return;
    }
    setStep((prev) => prev + 1);
  };

  // No ISO to Date/Date to ISO helpers exposed to the frontend. Everything is DD/MM/YYYY in the frontend after this point.

  return (
    <>
      <ToastContainer />
      <div className=" bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
          {/* Heading */}
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Children Registration
          </h1>
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex-1 flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-3 text-sm font-medium ${
                    step >= i + 1 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <Section title="Children & Parent Details">
                  <Input
                    label="Email (for login)*"
                    value={formData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("email", e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                    style={
                      shouldShowError("email") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Child Full Name (CAPITAL LETTERS)*"
                    value={formData.childFullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("childFullName", e.target.value)}
                    required
                    style={
                      shouldShowError("childFullName") ? { borderColor: "red" } : {}
                    }
                  />
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      Gender*
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => update("gender", e.target.value)}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                      style={shouldShowError("gender") ? { borderColor: "red" } : {}}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {/* Date of birth */}
                  <DateInput
                    label="Date of Birth*"
                    value={formData.childDOB}
                    onChange={(value: string) => {
                      // Store in state as dd/mm/yyyy only
                      update("childDOB", value);
                    }}
                    required
                    style={
                      shouldShowError("childDOB") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Father's Full Name*"
                    value={formData.fatherFullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("fatherFullName", e.target.value)}
                    required
                    style={
                      shouldShowError("fatherFullName") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Mother's Full Name*"
                    value={formData.motherFullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("motherFullName", e.target.value)}
                    required
                    style={
                      shouldShowError("motherFullName") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Parent Email*"
                    value={formData.parentEmail}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("parentEmail", e.target.value)}
                    type="email"
                    required
                    style={
                      shouldShowError("parentEmail") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Mobile Number 1*"
                    value={formData.mobile1}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile1", e.target.value)}
                    type="tel"
                    required
                    style={
                      shouldShowError("mobile1") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Mobile Number 2 (optional)"
                    value={formData.mobile2}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile2", e.target.value)}
                    type="tel"
                  />
                  <Input
                    label="Complete Address*"
                    value={formData.address}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("address", e.target.value)}
                    required
                    style={
                      shouldShowError("address") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Area Name*"
                    value={formData.areaName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("areaName", e.target.value)}
                    required
                    style={
                      shouldShowError("areaName") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Pincode*"
                    value={formData.pincode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("pincode", e.target.value)}
                    required
                    style={
                      shouldShowError("pincode") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Brief Information on Diagnosis*"
                    value={formData.diagnosisInfo}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("diagnosisInfo", e.target.value)}
                    required
                    style={
                      shouldShowError("diagnosisInfo") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Child Reference*"
                    value={formData.childReference}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("childReference", e.target.value)}
                    required
                    style={
                      shouldShowError("childReference") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Parent Occupation*"
                    value={formData.parentOccupation}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("parentOccupation", e.target.value)}
                    required
                    style={
                      shouldShowError("parentOccupation") ? { borderColor: "red" } : {}
                    }
                  />
                  <File
                    label="Profile Photo (optional, JPG/PNG)"
                    onChange={(file: File) => update("profilePhoto", file)}
                  />
                  <File
                    label="Other Document (optional)"
                    onChange={(file: File) => update("otherDocument", file)}
                  />
                </Section>
              )}

              {step === 2 && (
                <Section title="Remarks">
                  <Input
                    label="Additional Remarks (If Any)"
                    value={formData.remarks}
                    as="textarea"
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("remarks", e.target.value)}
                    rows={5}
                  />
                </Section>
              )}

              {step === 3 && (
                <Section2 title="Review & Submit">
                  <div className="flex flex-col w-full">
                    <div className="bg-slate-50 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Children Details</h3>
                        <Detail label="Email" value={formData.email} />
                        <Detail label="Child Name" value={formData.childFullName} />
                        <Detail label="Gender" value={formData.gender} />
                        <Detail label="Date of Birth" value={formatToDisplayDate(formData.childDOB)} />
                        <Detail label="Diagnosis Info" value={formData.diagnosisInfo} />
                        <Detail label="Child Reference" value={formData.childReference} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Parent Details</h3>
                        <Detail label="Father's Name" value={formData.fatherFullName} />
                        <Detail label="Mother's Name" value={formData.motherFullName} />
                        <Detail label="Parent Email" value={formData.parentEmail} />
                        <Detail label="Parent Occupation" value={formData.parentOccupation} />
                        <Detail label="Mobile 1" value={formData.mobile1} />
                        <Detail label="Mobile 2" value={formData.mobile2} />
                        <Detail label="Area Name" value={formData.areaName} />
                        <Detail label="Pincode" value={formData.pincode} />
                        <Detail label="Address" value={formData.address} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Uploaded Documents</h3>
                        <Detail label="Profile Photo" value={formData.profilePhoto ? formData.profilePhoto.name : 'Not Uploaded'} />
                        <Detail label="Other Document" value={formData.otherDocument ? formData.otherDocument.name : 'Not Uploaded'} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Remarks</h3>
                        <span className="text-gray-900">{formData.remarks ? formData.remarks : <span className="text-gray-400 text-sm">No remarks provided.</span>}</span>
                      </div>
                    </div>
                  </div>
                </Section2>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              disabled={step === 1 || submitting}
              onClick={() => setStep((prev) => prev - 1)}
              className="px-4 py-2 rounded-lg border disabled:opacity-40"
            >
              Previous
            </button>
            {step < 3 ? (
              <button
                disabled={submitting}
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
              >
                Next
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={submit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg shadow"
              >
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: DetailProps) {
  return (
    <div className="flex items-center mb-2">
      <span className="font-medium text-gray-700 w-40">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Section2({ title, children }: SectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="grid grid-cols-1  gap-4">{children}</div>
    </div>
  );
}

function Input({ label, as = "input", rows, required, style, ...props }: InputProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">
        {label}
        {required && !label.includes("*") && (
          <span className="text-red-600 ml-0.5">*</span>
        )}
      </label>
      {as === "textarea" ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          required={required}
          style={style}
          className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      ) : (
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          required={required}
          style={style}
          className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );
}

// Date input using react-datepicker, always DD/MM/YYYY for frontend
function DateInput({
  label,
  value,
  onChange,
  required,
  // style,
}: {
  label: string;
  value: string;
  onChange: (ddmmyyyy: string) => void;
  required?: boolean;
  style?: React.CSSProperties;
}) {
  // Receive and emit date in 'dd/mm/yyyy' only (frontend format)
  // Parse dd/mm/yyyy to Date for DatePicker, and on select, emit dd/mm/yyyy to parent

  // If the value is in dd/mm/yyyy, turn into Date
  const selectedDate = value ? ddmmyyyyToDate(value) : null;

  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">
        {label}
        {required && !label.includes("*") && (
          <span className="text-red-600 ml-0.5">*</span>
        )}
      </label>
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          onChange(date ? dateToDDMMYYYY(date) : "");
        }}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        className={
          "p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
        }
        required={required}
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={120}
        maxDate={new Date()}
      />
    </div>
  );
}

function File({ label, onChange }: FileProps) {
  return (
    <div>
      <label className="text-sm pb-4">{label}</label>
      <div className="border-2 border-dashed rounded-xl text-center hover:border-blue-500 transition">
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onChange(e.target.files[0]);
            }
          }}
          className="text-sm px-4 py-6"
        />
      </div>
    </div>
  );
}
