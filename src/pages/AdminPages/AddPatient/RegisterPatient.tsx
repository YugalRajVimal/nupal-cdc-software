import { useState, ChangeEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const steps = ["Personal", "Extra Details", "Review"];

interface FormDataState {
  email: string;
  childFullName: string;
  gender: string;
  childDOB: string;
  fatherFullName: string;
  // plannedSessionsPerMonth: string; // Hidden
  // package: string; // Hidden
  motherFullName: string;
  parentEmail: string;
  mobile1: string;
  mobile2: string;
  address: string;
  areaName: string;
  pincode: string; // <-- ADDED PINCODE
  diagnosisInfo: string;
  childReference: string;
  parentOccupation: string;
  remarks: string;
  otherDocument?: File;
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
  "pincode", // <-- MANDATORY PINCODE
  "diagnosisInfo",
  "childReference",
  "parentOccupation",
];

export default function PatientRegistration() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormDataState>({
    email: "",
    childFullName: "",
    gender: "",
    childDOB: "",
    fatherFullName: "",
    // plannedSessionsPerMonth: "",
    // package: "",
    motherFullName: "",
    parentEmail: "",
    mobile1: "",
    mobile2: "",
    address: "",
    areaName: "",
    pincode: "", // <-- PINCODE STATE
    diagnosisInfo: "",
    childReference: "",
    parentOccupation: "",
    remarks: "",
    otherDocument: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const update = (key: keyof FormDataState, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Simple validation function for required fields (except mobile2, remarks, otherDocument)
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
              "pincode", // <-- ensure PINCODE is included here
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
        )
    }
    return true;
  };

  const submit = async () => {
    setShowErrors(true);
    const missing = missingFields();
    if (missing.length > 0) {
      toast.error("Please fill all mandatory fields.", { position: "top-right" });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          if (k === "otherDocument" && v instanceof File) {
            payload.append(k, v as unknown as File);
          } else if (k !== "otherDocument") {
            payload.append(k, v as string);
          }
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/patients`, {
        method: "POST",
        body: payload,
      });

      for (let pair of payload.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (!res.ok) {
        const msg = await res.json();
        console.log(msg.message);
        toast.error("Failed to register patient: " + msg.message, { position: "top-right" });
        setSubmitting(false);
        return;
      }
      toast.success("Patient registered successfully", { position: "top-right" });
    } catch (error: any) {
      console.log(error);
      toast.error("Registration failed: " + (error?.message || error), { position: "top-right" });
    }
    setSubmitting(false);
  };

  // Highlighting for missing input fields
  const shouldShowError = (field: keyof FormDataState) =>
    showErrors &&
    mandatoryFields.includes(field) &&
    (
      !formData[field] ||
      (typeof formData[field] === "string" && formData[field].trim() === "")
    );

  // NEW: Next button always enabled, but show toast if required fields not filled
  const handleNext = () => {
    setShowErrors(true);
    if (!canProceed()) {
      toast.error("Please fill all mandatory fields before proceeding.", { position: "top-right" });
      return;
    }
    setStep((prev) => prev + 1);
  };

  return (
    <>
      <ToastContainer />
      <div className=" bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">

          {/* Heading */}
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Patient Registration</h1>
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex-1 flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${step >= i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i + 1}
                </div>
                <span className={`ml-3 text-sm font-medium ${step >= i + 1 ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-300 mx-4" />}
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
              {/* Step 1: Patient Personal Details */}
              {step === 1 && (
                <Section title="Patient & Parent Details">
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
                  <Input
                    label="Gender*"
                    value={formData.gender}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("gender", e.target.value)}
                    placeholder="Male / Female / Other"
                    required
                    style={
                      shouldShowError("gender") ? { borderColor: "red" } : {}
                    }
                  />
                  <Input
                    label="Date of Birth*"
                    value={formData.childDOB}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("childDOB", e.target.value)}
                    type="date"
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
                  {/* Hide Planned Sessions Per Month */}
                  {/* <Input
                    label="Planned Sessions Per Month"
                    value={formData.plannedSessionsPerMonth}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("plannedSessionsPerMonth", e.target.value)}
                    type="number"
                    min={0}
                  /> */}
                  {/* Hide Package select */}
                  {/* <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Select Package
                    </label>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={formData.package}
                      onChange={(e) => update("package", e.target.value)}
                    >
                      <option value="">Choose</option>
                      <option value="1-Session [800]">1-Session [800]</option>
                      <option value="10-Sessions; Total Cost 7000 [700]">10-Sessions; Total Cost 7000 [700]</option>
                      <option value="20-Sessions; Total Cost 14000 [700]">20-Sessions; Total Cost 14000 [700]</option>
                      <option value="30-Sessions; Total Cost 195000 [Rs 650]">30-Sessions; Total Cost 195000 [Rs 650]</option>
                      <option value="40-Sessions; Total Cost 22000 [550]">40-Sessions; Total Cost 22000 [550]</option>
                      <option value="50-Sessions; Total Cost 27500 [550]">50-Sessions; Total Cost 27500 [550]</option>
                      <option value="60-Sessions; Total Cost 33000 [550]">60-Sessions; Total Cost 33000 [550]</option>
                      <option value="80-Sessions; Total Cost 44000 [550]">80-Sessions; Total Cost 44000 [550]</option>
                      <option value="100-Sessions; Total Cost 55000 [550]">100-Sessions; Total Cost 55000 [550]</option>
                      <option value="125-Sessions; Total Cost 68750 [550]">125-Sessions; Total Cost 68750 [550]</option>
                      <option value="150-Sessions; Total Cost 82500 [550]">150-Sessions; Total Cost 82500 [550]</option>
                      <option value="175-Sessions; Total Cost 96250 [550]">175-Sessions; Total Cost 96250 [550]</option>
                      <option value="200-Sessions; Total Cost 110000 [550]">200-Sessions; Total Cost 110000 [550]</option>
                      <option value="225-Sessions; Total Cost 123750 [550]">225-Sessions; Total Cost 123750 [550]</option>
                      <option value="250-Sessions; Total Cost 137500 [550]">250-Sessions; Total Cost 137500 [550]</option>
                      <option value="275-Sessions; Total Cost 151250 [550]">275-Sessions; Total Cost 151250 [550]</option>
                      <option value="300-Sessions; Total Cost 165000 [550]">300-Sessions; Total Cost 165000 [550]</option>
                      <option value="Vision Assessment [1200]">Vision Assessment [1200]</option>
                      <option value="Vision 1-Session [1200]">Vision 1-Session [1200]</option>
                      <option value="Vision 10-Sessions; Total Cost 9000 [900]">Vision 10-Sessions; Total Cost 9000 [900]</option>
                    </select>
                  </div> */}
                  <File
                    label="Other Document (optional)"
                    onChange={(file: File) => update("otherDocument", file)}
                  />
                </Section>
              )}

              {/* Step 3: Remarks/Notes */}
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

              {/* Step 4: Review */}
              {step === 3 && (
                <Section2 title="Review & Submit">
                  <div className="flex flex-col w-full">
                    <div className="bg-slate-50 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Patient Details</h3>
                        <Detail label="Email" value={formData.email} />
                        <Detail label="Child Name" value={formData.childFullName} />
                        <Detail label="Gender" value={formData.gender} />
                        <Detail label="Date of Birth" value={formData.childDOB} />
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
            >Previous</button>
            {step < 3 ? (
              <button
                // Always enabled (except during submitting). Do not check canProceed() here.
                disabled={submitting}
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
              >Next</button>
            ) : (
              <button
                disabled={submitting}
                onClick={submit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg shadow"
              >{submitting ? "Submitting..." : "Submit Registration"}</button>
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
        {label}{required && !label.includes('*') && <span className="text-red-600 ml-0.5">*</span>}
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

function File({ label, onChange }: FileProps) {
  return (
    <div>
      <label className="text-sm pb-4">{label}</label>
      <div className="border-2 border-dashed rounded-xl text-center hover:border-blue-500 transition">
        <input
          type="file"
          onChange={e => {
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
