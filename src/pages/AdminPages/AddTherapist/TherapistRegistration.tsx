import { useState, ReactNode, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Personal", "Documents", "Banking", "Review"];

type NullableFile = File | null;
type FormDataType = {
  fullName: string;
  fathersName: string;
  mobile1: string;
  mobile2: string;
  address: string;
  reference: string;
  aadhaarFront: NullableFile;
  aadhaarBack: NullableFile;
  photo: NullableFile;
  resume: NullableFile;
  certificate: NullableFile;
  accountHolder: string;
  bankName: string;
  ifsc: string;
  accountNumber: string;
  upi: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  website: string;
  portfolio: string;
  blog: string;
  remarks: string;
};

export default function TherapistRegistration() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormDataType>({
    fullName: "",
    fathersName: "",
    mobile1: "",
    mobile2: "",
    address: "",
    reference: "",
    aadhaarFront: null,
    aadhaarBack: null,
    photo: null,
    resume: null,
    certificate: null,
    accountHolder: "",
    bankName: "",
    ifsc: "",
    accountNumber: "",
    upi: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    website: "",
    portfolio: "",
    blog: "",
    remarks: ""
  });

  const update = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => setFormData({ ...formData, [key]: value });

  const submit = async () => {
    const payload = new FormData();
    (Object.entries(formData) as [keyof FormDataType, FormDataType[keyof FormDataType]][]).forEach(([k, v]) => {
      if (
        k === "aadhaarFront" ||
        k === "aadhaarBack" ||
        k === "photo" ||
        k === "resume" ||
        k === "certificate"
      ) {
        if (v instanceof File) {
          payload.append(k, v);
        }
      } else if (typeof v === "string") {
        payload.append(k, v);
      } else {
        // skip if not a string or File
        payload.append(k, "");
      }
    });
    await fetch("/api/therapist/register", { method: "POST", body: payload });
    alert("Registration submitted");
  };

  return (
    <div className=" bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Therapist Registration</h1>
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
            {step === 1 && (
              <Section title="Personal Information">
                <Input label="Full Name" value={formData.fullName} onChange={(e: ChangeEvent<HTMLInputElement>) => update("fullName", e.target.value)} />
                <Input label="Father's Name" value={formData.fathersName} onChange={(e: ChangeEvent<HTMLInputElement>) => update("fathersName", e.target.value)} />
                <Input label="Mobile Number 1" value={formData.mobile1} onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile1", e.target.value)} />
                <Input label="Mobile Number 2" value={formData.mobile2} onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile2", e.target.value)} />
                <Input label="Full Address" value={formData.address} onChange={(e: ChangeEvent<HTMLInputElement>) => update("address", e.target.value)} />
                <Input label="Reference" value={formData.reference} onChange={(e: ChangeEvent<HTMLInputElement>) => update("reference", e.target.value)} />
              </Section>
            )}

            {step === 2 && (
              <Section title="Document Upload">
                <File label="Aadhaar Card (Front)" onChange={(f?: File) => update("aadhaarFront", f ?? null)} />
                <File label="Aadhaar Card (Back)" onChange={(f?: File) => update("aadhaarBack", f ?? null)} />
                <File label="Current Photo" onChange={(f?: File) => update("photo", f ?? null)} />
                <File label="Latest Resume" onChange={(f?: File) => update("resume", f ?? null)} />
                <File label="RCI / OT / PT Certificate" onChange={(f?: File) => update("certificate", f ?? null)} />
              </Section>
            )}

            {step === 3 && (
              <>
                <Section title="Bank Details">
                  <Input label="Account Holder Name" onChange={(e: ChangeEvent<HTMLInputElement>) => update("accountHolder", e.target.value)} />
                  <Input label="Bank Name" onChange={(e: ChangeEvent<HTMLInputElement>) => update("bankName", e.target.value)} />
                  <Input label="IFSC Code" onChange={(e: ChangeEvent<HTMLInputElement>) => update("ifsc", e.target.value)} />
                  <Input label="Account Number" onChange={(e: ChangeEvent<HTMLInputElement>) => update("accountNumber", e.target.value)} />
                  <Input label="UPI Address" onChange={(e: ChangeEvent<HTMLInputElement>) => update("upi", e.target.value)} />
                </Section>
                <div className="mt-10">

                </div>
                <Section title="Web Links (Optional)">
                  <Input label="LinkedIn URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("linkedin", e.target.value)} />
                  <Input label="Twitter URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("twitter", e.target.value)} />
                  <Input label="Facebook URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("facebook", e.target.value)} />
                  <Input label="Instagram URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("instagram", e.target.value)} />
                  <Input label="YouTube URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("youtube", e.target.value)} />
                  <Input label="Website URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("website", e.target.value)} />
                  <Input label="Portfolio URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("portfolio", e.target.value)} />
                  <Input label="Blog URL" onChange={(e: ChangeEvent<HTMLInputElement>) => update("blog", e.target.value)} />
                </Section>
              </>
            )}

            {step === 4 && (
              <Section2 title="Review & Submit">
                <div className="flex flex-col w-full">
                    <div className="bg-slate-50 p-6  rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Personal Information</h3>
                        <Detail label="Full Name" value={formData.fullName} />
                        <Detail label="Father's Name" value={formData.fathersName} />
                        <Detail label="Mobile Number 1" value={formData.mobile1} />
                        <Detail label="Mobile Number 2" value={formData.mobile2} />
                        <Detail label="Full Address" value={formData.address} />
                        <Detail label="Reference" value={formData.reference} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Bank Details</h3>
                        <Detail label="Account Holder Name" value={formData.accountHolder} />
                        <Detail label="Bank Name" value={formData.bankName} />
                        <Detail label="IFSC Code" value={formData.ifsc} />
                        <Detail label="Account Number" value={formData.accountNumber} />
                        <Detail label="UPI Address" value={formData.upi} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Uploaded Documents</h3>
                        <Detail label="Aadhaar Front" value={formData.aadhaarFront instanceof File ? formData.aadhaarFront.name : 'Not Uploaded'} />
                        <Detail label="Aadhaar Back" value={formData.aadhaarBack instanceof File ? formData.aadhaarBack.name : 'Not Uploaded'} />
                        <Detail label="Photo" value={formData.photo instanceof File ? formData.photo.name : 'Not Uploaded'} />
                        <Detail label="Resume" value={formData.resume instanceof File ? formData.resume.name : 'Not Uploaded'} />
                        <Detail label="Certificate" value={formData.certificate instanceof File ? formData.certificate.name : 'Not Uploaded'} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Web & Social Links</h3>
                        {formData.linkedin && <Detail label="LinkedIn" value={formData.linkedin} />}
                        {formData.twitter && <Detail label="Twitter" value={formData.twitter} />}
                        {formData.facebook && <Detail label="Facebook" value={formData.facebook} />}
                        {formData.instagram && <Detail label="Instagram" value={formData.instagram} />}
                        {formData.youtube && <Detail label="YouTube" value={formData.youtube} />}
                        {formData.website && <Detail label="Website" value={formData.website} />}
                        {formData.portfolio && <Detail label="Portfolio" value={formData.portfolio} />}
                        {formData.blog && <Detail label="Blog" value={formData.blog} />}
                        {!(formData.linkedin||formData.twitter||formData.facebook||formData.instagram||formData.youtube||formData.website||formData.portfolio||formData.blog) && (
                        <p className="text-gray-400 text-sm">No links provided.</p>
                        )}
                    </div>
                    </div>
                    <div className="mt-8">
                    <label className="font-semibold mb-2 block text-gray-700">Internal Remarks</label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Internal remarks"
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("remarks", e.target.value)}
                        rows={3}
                    />
                    </div>
                </div>
               
              </Section2>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <button disabled={step === 1} onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Previous</button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow">Next</button>
          ) : (
            <button onClick={submit} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow">Submit Registration</button>
          )}
        </div>
      </div>
    </div>
  );
}

type DetailProps = {
  label: string;
  value: ReactNode;
};

function Detail({ label, value }: DetailProps) {
  return (
    <div className="flex items-center mb-2">
      <span className="font-medium text-gray-700 w-40">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
};

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

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Input({ label, ...props }: InputProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">{label}</label>
      <input {...props} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
  );
}

type FileProps = {
  label: string;
  onChange: (file?: File) => void;
};

function File({ label, onChange }: FileProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange(e.target.files[0]);
    } else {
      onChange(undefined);
    }
  };
  return (
    <div>
      <label className="text-sm pb-4">{label}</label>
      <div className="border-2 border-dashed rounded-xl  text-center hover:border-blue-500 transition">
        <input
          type="file"
          onChange={handleChange}
          className="text-sm px-4 py-6"
        />
      </div>
    </div>
  );
}
