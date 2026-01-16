// import { useState, ReactNode, ChangeEvent } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const steps = ["Personal", "Documents", "Banking", "Review"];

// type NullableFile = File | null;
// type FormDataType = {
//   fullName: string;
//   email: string;
//   fathersName: string;
//   mobile1: string;
//   mobile2: string;
//   address: string;
//   reference: string;
//   specializations: string;
//   experienceYears: string;
//   aadhaarFront: NullableFile;
//   aadhaarBack: NullableFile;
//   photo: NullableFile;
//   resume: NullableFile;
//   certificate: NullableFile;
//   accountHolder: string;
//   bankName: string;
//   ifsc: string;
//   accountNumber: string;
//   upi: string;
//   linkedin: string;
//   twitter: string;
//   facebook: string;
//   instagram: string;
//   youtube: string;
//   website: string;
//   portfolio: string;
//   blog: string;
//   remarks: string;
// };

// const FILE_FIELDS: (keyof FormDataType)[] = [
//   "aadhaarFront",
//   "aadhaarBack",
//   "photo",
//   "resume",
//   "certificate",
// ];

// const API_BASE_URL = import.meta.env.VITE_API_URL;

// const initialFormData: FormDataType = {
//   fullName: "",
//   email: "",
//   fathersName: "",
//   mobile1: "",
//   mobile2: "",
//   address: "",
//   reference: "",
//   specializations: "",
//   experienceYears: "",
//   aadhaarFront: null,
//   aadhaarBack: null,
//   photo: null,
//   resume: null,
//   certificate: null,
//   accountHolder: "",
//   bankName: "",
//   ifsc: "",
//   accountNumber: "",
//   upi: "",
//   linkedin: "",
//   twitter: "",
//   facebook: "",
//   instagram: "",
//   youtube: "",
//   website: "",
//   portfolio: "",
//   blog: "",
//   remarks: "",
// };

// const stepRequiredFields: (keyof FormDataType)[][] = [
//   [
//     "fullName",
//     "email",
//     "fathersName",
//     "mobile1",
//     "address",
//     "reference",
//     "specializations",
//     "experienceYears",
//   ],
//   [
//     "aadhaarFront",
//     "aadhaarBack",
//     "photo",
//     "resume",
//     "certificate"
//   ],
//   [
//     "accountHolder",
//     "bankName",
//     "ifsc",
//     "accountNumber",
//     "upi"
//   ],
// ];

// // Simple validators
// function isEmail(str: string): boolean {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
// }
// function isPhone(str: string): boolean {
//   return /^(?:\+91|0)?[6-9]\d{9}$/.test(str.trim());
// }
// function isURL(str: string): boolean {
//   if (!str) return true;
//   try {
//     new URL(str.startsWith("http") ? str : "http://" + str);
//     return /\./.test(str) && !/\s/.test(str);
//   } catch {
//     return false;
//   }
// }

// // Step validation for UI feedback only
// function validateStepFields(
//   formData: FormDataType,
//   fields: (keyof FormDataType)[]
// ): { valid: boolean; missing: (keyof FormDataType)[] } {
//   // For file fields, just check presence; for others, check string empty.
//   const missing = fields.filter((k) => {
//     const val = formData[k];
//     if (FILE_FIELDS.includes(k)) return !val;
//     return !val || (typeof val === "string" && val.trim() === "");
//   });
//   return { valid: missing.length === 0, missing };
// }

// const DOCUMENT_LABELS: { [key in keyof FormDataType]?: string } = {
//   aadhaarFront: "Aadhaar Card (Front)",
//   aadhaarBack: "Aadhaar Card (Back)",
//   photo: "Photo",
//   resume: "Resume",
//   certificate: "Certificate"
// };

// export default function TherapistRegistration() {
//   // Store all file fields in React state: Best Practice!
//   const [documents, setDocuments] = useState<{
//     aadhaarFront: NullableFile;
//     aadhaarBack: NullableFile;
//     photo: NullableFile;
//     resume: NullableFile;
//     certificate: NullableFile;
//   }>({
//     aadhaarFront: null,
//     aadhaarBack: null,
//     photo: null,
//     resume: null,
//     certificate: null,
//   });

//   // Non-file fields in state
//   const [step, setStep] = useState<number>(1);
//   const [formData, setFormData] = useState<Omit<FormDataType,
//     | "aadhaarFront"
//     | "aadhaarBack"
//     | "photo"
//     | "resume"
//     | "certificate"
//   >>({
//     fullName: "",
//     email: "",
//     fathersName: "",
//     mobile1: "",
//     mobile2: "",
//     address: "",
//     reference: "",
//     specializations: "",
//     experienceYears: "",
//     accountHolder: "",
//     bankName: "",
//     ifsc: "",
//     accountNumber: "",
//     upi: "",
//     linkedin: "",
//     twitter: "",
//     facebook: "",
//     instagram: "",
//     youtube: "",
//     website: "",
//     portfolio: "",
//     blog: "",
//     remarks: "",
//   });
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, string>>>({});

//   // Merge state: put document fields into the merged form object
//   const getFullFormData = (): FormDataType => ({
//     ...formData,
//     ...documents,
//   });

//   // File validation: only checks presence (not File-ness)
//   function isValidDocumentFile(val: NullableFile): boolean {
//     // eslint-disable-next-line no-console
//     const isValid = Boolean(val);
//     // eslint-disable-next-line no-console
//     console.log(isValid, val && (val as File).name, val && (val as File).size, val instanceof File);
//     return isValid;
//   }

//   // Live validate inputs, update field errors in state
//   const liveValidate = (key: keyof FormDataType, value: string) => {
//     let err = "";
//     if (key === "email" && value) {
//       if (!isEmail(value)) err = "Invalid email address";
//     }
//     if ((key === "mobile1" || key === "mobile2") && value) {
//       if (!isPhone(value)) err = "Invalid mobile number";
//     }
//     if (
//       [
//         "linkedin",
//         "twitter",
//         "facebook",
//         "instagram",
//         "youtube",
//         "website",
//         "portfolio",
//         "blog",
//       ].includes(key) && value
//     ) {
//       if (!isURL(value)) err = "Invalid URL";
//     }
//     if (key === "experienceYears" && value) {
//       const n = Number(value);
//       if (isNaN(n) || n < 0 || n > 100 || !/^\d{1,2}$|100/.test(value)) {
//         err = "Invalid years (must be 0-100)";
//       }
//     }
//     if (key === "ifsc" && value) {
//       if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(value.trim())) {
//         err = "Invalid IFSC code";
//       }
//     }
//     setErrors(prev => ({ ...prev, [key]: err }));
//   };

//   // Update field state for docs
//   const updateDoc = (key: keyof typeof documents, file: NullableFile) => {
//     setDocuments((prev) => ({ ...prev, [key]: file }));
//     setErrors((prev) => ({ ...prev, [key]: "" })); // clear error on change
//   };

//   // Update field state, also handle doc fields
//   const update = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
//     if (FILE_FIELDS.includes(key)) {
//       updateDoc(key as keyof typeof documents, value as NullableFile);
//       // eslint-disable-next-line no-console
//       console.log("UPDATED FILE FIELD:", key, value);
//     } else {
//       setFormData((prev) => {
//         const updated = { ...prev, [key]: value };
//         return updated;
//       });
//     }

//     if (typeof value === "string") {
//       liveValidate(key, value);
//     }
//   };

//   // Per-step error check, used before allowing next step
//   function hasStepErrors(curStep: number): boolean {
//     const fullFormData = getFullFormData();
//     const fields = stepRequiredFields[curStep - 1];
//     let hasErrors = false;
//     const errorMessages: string[] = [];
//     fields.forEach((k) => {
//       if (errors[k]) {
//         hasErrors = true;
//         errorMessages.push(`Field "${String(k)}" has error: ${errors[k]}`);
//       }
//       const val = fullFormData[k];
//       if (FILE_FIELDS.includes(k)) {
//         if (!isValidDocumentFile(val as NullableFile)) {
//           hasErrors = true;
//           errorMessages.push(`File field "${String(k)}" is invalid or missing`);
//         }
//       } else {
//         if (!val || (typeof val === "string" && val.trim() === "")) {
//           hasErrors = true;
//           errorMessages.push(`Field "${String(k)}" is required and empty`);
//         }
//       }
//       // Advanced validation
//       if (k === "email" && val && !isEmail(val as string)) {
//         hasErrors = true;
//         errorMessages.push(`Field "${String(k)}" is not a valid email`);
//       }
//       if ((k === "mobile1" || k === "mobile2") && val && !isPhone(val as string)) {
//         hasErrors = true;
//         errorMessages.push(`Field "${String(k)}" is not a valid phone number`);
//       }
//       if (k === "experienceYears" && val &&
//           (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 100)) {
//         hasErrors = true;
//         errorMessages.push(`Field "experienceYears" has invalid value: "${val}"`);
//       }
//       if (k === "ifsc" && val && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test((val as string).trim())) {
//         hasErrors = true;
//         errorMessages.push(`Field "ifsc" is not a valid IFSC code`);
//       }
//     });
//     console.log(hasErrors);
//     if (hasErrors && errorMessages.length > 0) {
//       // eslint-disable-next-line no-console
//       console.log("[hasStepErrors] Validation errors:", errorMessages);
//     }
//     return hasErrors;
//   }

//   // Main submit/POST handler unchanged except file state
//   const submit = async () => {
//     const fullFormData = getFullFormData();
//     // Validate ALL required fields for submit
//     const allRequiredFields = stepRequiredFields.flat();
//     let errorFound = false;
//     const errorFields: string[] = [];

//     allRequiredFields.forEach((k) => {
//       const val = fullFormData[k];
//       if (FILE_FIELDS.includes(k)) {
//         if (!isValidDocumentFile(val as NullableFile)) {
//           setErrors((prev) => ({
//             ...prev,
//             [k]: "Required"
//           }));
//           errorFields.push(
//             DOCUMENT_LABELS[k] ||
//               (typeof k === "string"
//                 ? k.charAt(0).toUpperCase() + k.slice(1)
//                 : String(k))
//           );
//           errorFound = true;
//         }
//       } else {
//         if (!val || (typeof val === "string" && val.trim() === "")) {
//           setErrors((prev) => ({
//             ...prev,
//             [k]: "Required"
//           }));
//           errorFields.push(typeof k === "string" ? k.charAt(0).toUpperCase() + k.slice(1) : String(k));
//           errorFound = true;
//         }
//       }
//       // Inline validators for fields on submit
//       if (k === "email" && (!val || !isEmail(val as string))) {
//         setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
//         errorFields.push("Email");
//         errorFound = true;
//       }
//       if (k === "mobile1" && (!val || !isPhone(val as string))) {
//         setErrors((prev) => ({ ...prev, mobile1: "Invalid mobile number" }));
//         errorFields.push("Mobile Number 1");
//         errorFound = true;
//       }
//       if (k === "mobile2" && val && !isPhone(val as string)) {
//         setErrors((prev) => ({ ...prev, mobile2: "Invalid mobile number" }));
//         errorFields.push("Mobile Number 2");
//         errorFound = true;
//       }
//       if (k === "experienceYears" && val &&
//           (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 100)) {
//         setErrors((prev) => ({
//           ...prev,
//           experienceYears: "Invalid years (must be 0-100)",
//         }));
//         errorFields.push("Years of Experience");
//         errorFound = true;
//       }
//       if (k === "ifsc" && val && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test((val as string).trim())) {
//         setErrors((prev) => ({ ...prev, ifsc: "Invalid IFSC code" }));
//         errorFields.push("IFSC Code");
//         errorFound = true;
//       }
//     });

//     [
//       "linkedin",
//       "twitter",
//       "facebook",
//       "instagram",
//       "youtube",
//       "website",
//       "portfolio",
//       "blog",
//     ].forEach(field => {
//       const k = field as keyof FormDataType;
//       if (fullFormData[k] && !isURL(fullFormData[k]! as string)) {
//         setErrors(prev => ({
//           ...prev,
//           [k]: "Invalid URL",
//         }));
//         errorFields.push(`${field.charAt(0).toUpperCase() + field.slice(1)} URL`);
//         errorFound = true;
//       }
//     });

//     if (errorFound) {
//       toast.error(
//         "Please correct the highlighted errors before submitting: " + errorFields.join(", "),
//         { position: "top-center", autoClose: 4000 }
//       );
//       return;
//     }

//     const payload = new FormData();
//     Object.entries(fullFormData).forEach(([key, val]) => {
//       if (FILE_FIELDS.includes(key as keyof FormDataType)) {
//         if (isValidDocumentFile(val as NullableFile)) {
//           payload.append(key, val as File);
//         }
//       } else {
//         payload.append(key, typeof val === "string" ? val : "");
//       }
//     });

//     const apiUrl = (API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "") + "/api/admin/therapist";
//     const res = await fetch(apiUrl, {
//       method: "POST",
//       body: payload,
//     });
//     if (res.status === 201) {
//       setSuccessMessage(`Registration submitted successfully!`);
//       toast.success("Therapist registered successfully!", {
//         position: "top-center",
//         autoClose: 1500,
//       });

//       setTimeout(() => {
//         setDocuments({
//           aadhaarFront: null,
//           aadhaarBack: null,
//           photo: null,
//           resume: null,
//           certificate: null,
//         });
//         setFormData({
//           fullName: "",
//           email: "",
//           fathersName: "",
//           mobile1: "",
//           mobile2: "",
//           address: "",
//           reference: "",
//           specializations: "",
//           experienceYears: "",
//           accountHolder: "",
//           bankName: "",
//           ifsc: "",
//           accountNumber: "",
//           upi: "",
//           linkedin: "",
//           twitter: "",
//           facebook: "",
//           instagram: "",
//           youtube: "",
//           website: "",
//           portfolio: "",
//           blog: "",
//           remarks: "",
//         });
//         setStep(1);
//         setSuccessMessage(null);
//         window.location.href = "/admin";
//       }, 1600);
//     } else {
//       let data: any = {};
//       try {
//         data = await res.json();
//       } catch {}
//       toast.error(
//         "Failed to register therapist.\n" +
//           (data?.error ? `Error: ${data.error}` : ""),
//         {
//           position: "top-center",
//           autoClose: 4000,
//         }
//       );
//     }
//   };

//   // Debug: serializable copy for logging files
//   function serializeFormDataForLog(data: FormDataType) {
//     const result: { [k: string]: unknown } = {};
//     for (const key in data) {
//       const value = data[key as keyof FormDataType];
//       if (FILE_FIELDS.includes(key as keyof FormDataType)) {
//         if (value) {
//           result[key] = {
//             // Unsafe to access name/type/size, but OK for logging if value is a File
//             name: (value as File).name,
//             size: (value as File).size,
//             type: (value as File).type,
//           };
//         } else {
//           result[key] = null;
//         }
//       } else {
//         result[key] = value;
//       }
//     }
//     return result;
//   }

//   // Always use merged (persistent) FormData for UI
//   const mergedFormData = getFullFormData();

//   return (
//     <div className="bg-slate-50 flex items-center justify-center p-6">
//       <ToastContainer />
//       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
//         <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
//           Therapist Registration
//         </h1>
//         {/* Stepper */}
//         <div className="flex items-center justify-between mb-8">
//           {steps.map((label, i) => (
//             <div key={label} className="flex-1 flex items-center">
//               <div
//                 className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
//                   step >= i + 1
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-500"
//                 }`}
//               >
//                 {i + 1}
//               </div>
//               <span
//                 className={`ml-3 text-sm font-medium ${
//                   step >= i + 1 ? "text-blue-600" : "text-gray-400"
//                 }`}
//               >
//                 {label}
//               </span>
//               {i < steps.length - 1 && (
//                 <div className="flex-1 h-px bg-gray-300 mx-4" />
//               )}
//             </div>
//           ))}
//         </div>
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={step}
//             initial={{ opacity: 0, x: 40 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -40 }}
//             transition={{ duration: 0.3 }}
//           >
//             {/* Step 1: Personal */}
//             {step === 1 && (
//               <Section title="Personal Information">
//                 <Input
//                   label="Full Name *"
//                   value={mergedFormData.fullName}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("fullName", e.target.value)
//                   }
//                   required
//                   error={errors.fullName}
//                 />
//                 <Input
//                   label="Email *"
//                   type="email"
//                   value={mergedFormData.email}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("email", e.target.value)
//                   }
//                   required
//                   error={errors.email}
//                 />
//                 <Input
//                   label="Father's Name *"
//                   value={mergedFormData.fathersName}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("fathersName", e.target.value)
//                   }
//                   required
//                   error={errors.fathersName}
//                 />
//                 <Input
//                   label="Mobile Number 1 *"
//                   value={mergedFormData.mobile1}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("mobile1", e.target.value)
//                   }
//                   required
//                   error={errors.mobile1}
//                   maxLength={13}
//                   pattern="\d*"
//                   inputMode="tel"
//                 />
//                 <Input
//                   label="Mobile Number 2"
//                   value={mergedFormData.mobile2}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("mobile2", e.target.value)
//                   }
//                   error={errors.mobile2}
//                   maxLength={13}
//                   pattern="\d*"
//                   inputMode="tel"
//                 />
//                 <Input
//                   label="Full Address *"
//                   value={mergedFormData.address}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("address", e.target.value)
//                   }
//                   required
//                   error={errors.address}
//                 />
//                 <Input
//                   label="Reference *"
//                   value={mergedFormData.reference}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("reference", e.target.value)
//                   }
//                   required
//                   error={errors.reference}
//                 />
//                 <Input
//                   label="Specializations *"
//                   value={mergedFormData.specializations}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("specializations", e.target.value)
//                   }
//                   placeholder="e.g., Occupational Therapy, Speech Therapy"
//                   required
//                   error={errors.specializations}
//                 />
//                 <Input
//                   label="Years of Experience *"
//                   value={mergedFormData.experienceYears}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     update("experienceYears", e.target.value)
//                   }
//                   type="number"
//                   min="0"
//                   placeholder="e.g., 5"
//                   required
//                   error={errors.experienceYears}
//                 />
//               </Section>
//             )}

//             {/* Step 2: Docs */}
//             {step === 2 && (
//               <Section title="Document Upload">
//                 <File
//                   label="Aadhaar Card (Front) *"
//                   value={documents.aadhaarFront}
//                   error={errors.aadhaarFront}
//                   onChange={(f) => updateDoc("aadhaarFront", f)}
//                 />
//                 <File
//                   label="Aadhaar Card (Back) *"
//                   value={documents.aadhaarBack}
//                   error={errors.aadhaarBack}
//                   onChange={(f) => updateDoc("aadhaarBack", f)}
//                 />
//                 <File
//                   label="Current Photo *"
//                   value={documents.photo}
//                   error={errors.photo}
//                   onChange={(f) => updateDoc("photo", f)}
//                 />
//                 <File
//                   label="Latest Resume *"
//                   value={documents.resume}
//                   error={errors.resume}
//                   onChange={(f) => updateDoc("resume", f)}
//                 />
//                 <File
//                   label="RCI / OT / PT Certificate *"
//                   value={documents.certificate}
//                   error={errors.certificate}
//                   onChange={(f) => updateDoc("certificate", f)}
//                 />
//               </Section>
//             )}

//             {/* Step 3: Banking & Links */}
//             {step === 3 && (
//               <>
//                 <Section title="Bank Details">
//                   <Input
//                     label="Account Holder Name *"
//                     value={mergedFormData.accountHolder}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("accountHolder", e.target.value)
//                     }
//                     required
//                     error={errors.accountHolder}
//                   />
//                   <Input
//                     label="Bank Name *"
//                     value={mergedFormData.bankName}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("bankName", e.target.value)
//                     }
//                     required
//                     error={errors.bankName}
//                   />
//                   <Input
//                     label="IFSC Code *"
//                     value={mergedFormData.ifsc}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("ifsc", e.target.value)
//                     }
//                     required
//                     error={errors.ifsc}
//                     maxLength={11}
//                   />
//                   <Input
//                     label="Account Number *"
//                     value={mergedFormData.accountNumber}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("accountNumber", e.target.value)
//                     }
//                     required
//                     error={errors.accountNumber}
//                   />
//                   <Input
//                     label="UPI Address *"
//                     value={mergedFormData.upi}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("upi", e.target.value)
//                     }
//                     required
//                     error={errors.upi}
//                   />
//                 </Section>
//                 <div className="mt-10"></div>
//                 <Section title="Web Links (Optional)">
//                   <Input
//                     label="LinkedIn URL"
//                     value={mergedFormData.linkedin}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("linkedin", e.target.value)
//                     }
//                     error={errors.linkedin}
//                     placeholder="https://linkedin.com/..."
//                   />
//                   <Input
//                     label="Twitter URL"
//                     value={mergedFormData.twitter}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("twitter", e.target.value)
//                     }
//                     error={errors.twitter}
//                     placeholder="https://twitter.com/..."
//                   />
//                   <Input
//                     label="Facebook URL"
//                     value={mergedFormData.facebook}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("facebook", e.target.value)
//                     }
//                     error={errors.facebook}
//                     placeholder="https://facebook.com/..."
//                   />
//                   <Input
//                     label="Instagram URL"
//                     value={mergedFormData.instagram}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("instagram", e.target.value)
//                     }
//                     error={errors.instagram}
//                     placeholder="https://instagram.com/..."
//                   />
//                   <Input
//                     label="YouTube URL"
//                     value={mergedFormData.youtube}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("youtube", e.target.value)
//                     }
//                     error={errors.youtube}
//                     placeholder="https://youtube.com/..."
//                   />
//                   <Input
//                     label="Website URL"
//                     value={mergedFormData.website}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("website", e.target.value)
//                     }
//                     error={errors.website}
//                     placeholder="https://yourwebsite.com"
//                   />
//                   <Input
//                     label="Portfolio URL"
//                     value={mergedFormData.portfolio}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("portfolio", e.target.value)
//                     }
//                     error={errors.portfolio}
//                     placeholder="https://..."
//                   />
//                   <Input
//                     label="Blog URL"
//                     value={mergedFormData.blog}
//                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                       update("blog", e.target.value)
//                     }
//                     error={errors.blog}
//                     placeholder="https://..."
//                   />
//                 </Section>
//               </>
//             )}

//             {/* Step 4: Review */}
//             {step === 4 && (
//               <Section2 title="Review & Submit">
//                 <div className="flex flex-col w-full">
//                   <div className="bg-slate-50 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
//                     <div>
//                       <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
//                         Personal Information
//                       </h3>
//                       <Detail label="Full Name" value={mergedFormData.fullName} />
//                       <Detail label="Email" value={mergedFormData.email} />
//                       <Detail label="Father's Name" value={mergedFormData.fathersName} />
//                       <Detail label="Mobile Number 1" value={mergedFormData.mobile1} />
//                       <Detail label="Mobile Number 2" value={mergedFormData.mobile2} />
//                       <Detail label="Full Address" value={mergedFormData.address} />
//                       <Detail label="Reference" value={mergedFormData.reference} />
//                       <Detail label="Specializations" value={mergedFormData.specializations} />
//                       <Detail label="Years of Experience" value={mergedFormData.experienceYears} />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
//                         Bank Details
//                       </h3>
//                       <Detail label="Account Holder Name" value={mergedFormData.accountHolder} />
//                       <Detail label="Bank Name" value={mergedFormData.bankName} />
//                       <Detail label="IFSC Code" value={mergedFormData.ifsc} />
//                       <Detail label="Account Number" value={mergedFormData.accountNumber} />
//                       <Detail label="UPI Address" value={mergedFormData.upi} />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
//                         Uploaded Documents
//                       </h3>
//                       <Detail
//                         label="Aadhaar Front"
//                         value={
//                           isValidDocumentFile(documents.aadhaarFront)
//                             ? (documents.aadhaarFront as File)?.name ?? "Uploaded"
//                             : "Not Uploaded"
//                         }
//                       />
//                       <Detail
//                         label="Aadhaar Back"
//                         value={
//                           isValidDocumentFile(documents.aadhaarBack)
//                             ? (documents.aadhaarBack as File)?.name ?? "Uploaded"
//                             : "Not Uploaded"
//                         }
//                       />
//                       <Detail
//                         label="Photo"
//                         value={
//                           isValidDocumentFile(documents.photo)
//                             ? (documents.photo as File)?.name ?? "Uploaded"
//                             : "Not Uploaded"
//                         }
//                       />
//                       <Detail
//                         label="Resume"
//                         value={
//                           isValidDocumentFile(documents.resume)
//                             ? (documents.resume as File)?.name ?? "Uploaded"
//                             : "Not Uploaded"
//                         }
//                       />
//                       <Detail
//                         label="Certificate"
//                         value={
//                           isValidDocumentFile(documents.certificate)
//                             ? (documents.certificate as File)?.name ?? "Uploaded"
//                             : "Not Uploaded"
//                         }
//                       />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
//                         Web & Social Links
//                       </h3>
//                       {mergedFormData.linkedin && (
//                         <Detail label="LinkedIn" value={mergedFormData.linkedin} />
//                       )}
//                       {mergedFormData.twitter && (
//                         <Detail label="Twitter" value={mergedFormData.twitter} />
//                       )}
//                       {mergedFormData.facebook && (
//                         <Detail label="Facebook" value={mergedFormData.facebook} />
//                       )}
//                       {mergedFormData.instagram && (
//                         <Detail label="Instagram" value={mergedFormData.instagram} />
//                       )}
//                       {mergedFormData.youtube && (
//                         <Detail label="YouTube" value={mergedFormData.youtube} />
//                       )}
//                       {mergedFormData.website && (
//                         <Detail label="Website" value={mergedFormData.website} />
//                       )}
//                       {mergedFormData.portfolio && (
//                         <Detail label="Portfolio" value={mergedFormData.portfolio} />
//                       )}
//                       {mergedFormData.blog && (
//                         <Detail label="Blog" value={mergedFormData.blog} />
//                       )}
//                       {!(
//                         mergedFormData.linkedin ||
//                         mergedFormData.twitter ||
//                         mergedFormData.facebook ||
//                         mergedFormData.instagram ||
//                         mergedFormData.youtube ||
//                         mergedFormData.website ||
//                         mergedFormData.portfolio ||
//                         mergedFormData.blog
//                       ) && (
//                         <p className="text-gray-400 text-sm">
//                           No links provided.
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="mt-8">
//                     <label className="font-semibold mb-2 block text-gray-700">
//                       Internal Remarks
//                     </label>
//                     <textarea
//                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                       placeholder="Internal remarks"
//                       value={mergedFormData.remarks}
//                       onChange={(
//                         e: ChangeEvent<HTMLTextAreaElement>
//                       ) => update("remarks", e.target.value)}
//                       rows={3}
//                     />
//                   </div>
//                 </div>
//               </Section2>
//             )}
//           </motion.div>
//         </AnimatePresence>

//         <div className="flex justify-between mt-8">
//           <button
//             disabled={step === 1 || !!successMessage}
//             onClick={() => setStep(step - 1)}
//             className="px-4 py-2 rounded-lg border disabled:opacity-40"
//           >
//             Previous
//           </button>
//           {step < 4 ? (
//             <button
//               onClick={() => {
//                 const fullFormData = getFullFormData();

//                 const fields = stepRequiredFields[step - 1];
//                 const { valid, missing } = validateStepFields(fullFormData, fields);
//                 let hasErrors = hasStepErrors(step);
//                 // eslint-disable-next-line no-console
//                 console.log("FILE_FIELDS", FILE_FIELDS);
//                 // eslint-disable-next-line no-console
//                 console.log("documents", documents);

//                 // On step 2 (Documents): strict check for all file fields, in state!
//                 if (step === 2) {
//                   const anyMissingFile = FILE_FIELDS.some((f) => !isValidDocumentFile(documents[f]));
//                   FILE_FIELDS.forEach(field => {
//                     if ((fields as Array<keyof FormDataType>).includes(field)) {
//                       const fileVal = documents[field];
//                       const isValid = isValidDocumentFile(fileVal);
//                       // shows the truth immediately
//                       // eslint-disable-next-line no-console
//                       console.log(isValid, field, fileVal?.name, fileVal?.size, fileVal instanceof File);
//                       if (!isValid) {
//                         setErrors(prev => ({ ...prev, [field]: "Required" }));
//                       }
//                     }
//                   });

//                   // eslint-disable-next-line no-console
//                   console.log({ anyMissingFile });

//                   if (anyMissingFile) {
//                     toast.error("Please upload all required documents.--", {
//                       position: "top-center",
//                       autoClose: 4000,
//                     });
//                     return;
//                   }
//                 }

//                 // Debug formData for current step
//                 // eslint-disable-next-line no-console
//                 console.log(
//                   `[TherapistRegistration][Step ${step + 1}] formData:`,
//                   serializeFormDataForLog(fullFormData)
//                 );
//                 console.log(valid, hasErrors);
//                 if (!valid || hasErrors) {
//                   missing.forEach(k =>
//                     setErrors(prev => ({ ...prev, [k]: "Required" }))
//                   );
//                   let message = "";
//                   if (step === 1) {
//                     message = "Please fill all mandatory personal details correctly. Check the highlighted fields for errors.";
//                   } else if (step === 2) {
//                     message = "Please upload all required documents.--";
//                   } else if (step === 3) {
//                     message = "Please fill all required bank details.";
//                   }
//                   toast.error(message, {
//                     position: "top-center",
//                     autoClose: 4000,
//                   });
//                   return;
//                 }
//                 setStep(step + 1);
//               }}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow"
//               disabled={!!successMessage}
//             >
//               Next
//             </button>
//           ) : (
//             <button
//               onClick={submit}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg shadow"
//               disabled={!!successMessage}
//             >
//               Submit Registration
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// type DetailProps = {
//   label: string;
//   value: ReactNode;
// };

// // For Detail and Section
// function Detail({ label, value }: DetailProps) {
//   return (
//     <div className="flex items-center mb-2">
//       <span className="font-medium text-gray-700 w-40">{label}:</span>
//       <span className="text-gray-900">{value}</span>
//     </div>
//   );
// }
// type SectionProps = {
//   title: string;
//   children: ReactNode;
// };

// function Section({ title, children }: SectionProps) {
//   return (
//     <div>
//       <h2 className="text-2xl font-semibold mb-6">{title}</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
//     </div>
//   );
// }

// function Section2({ title, children }: SectionProps) {
//   return (
//     <div>
//       <h2 className="text-2xl font-semibold mb-6">{title}</h2>
//       <div className="grid grid-cols-1  gap-4">{children}</div>
//     </div>
//   );
// }

// type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
//   label: string;
//   error?: string;
// };
// function Input({ label, error, ...props }: InputProps) {
//   return (
//     <div className="flex flex-col mb-1 relative">
//       <label className="text-sm text-gray-600 mb-1">{label}</label>
//       <input
//         {...props}
//         className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${error ? "border-red-500" : ""}`}
//         aria-invalid={!!error}
//         aria-describedby={error ? `${label.replace(/\s/g, "")}-error` : undefined}
//       />
//       {error && (
//         <span
//           className="text-xs mt-1 text-red-600"
//           id={`${label.replace(/\s/g, "")}-error`}
//         >
//           {error}
//         </span>
//       )}
//     </div>
//   );
// }

// type FileProps = {
//   label: string;
//   value: File | null;
//   error?: string;
//   onChange: (file: File | null) => void;
// };
// function File({ label, value, error, onChange }: FileProps) {
//   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] ?? null;
//     onChange(file);
//     // Allow selecting same file again
//     e.currentTarget.value = "";
//   };

//   return (
//     <div className="flex flex-col gap-1">
//       <label className="text-sm font-medium text-gray-700">{label}</label>
//       <div
//         className={`border-2 border-dashed rounded-xl p-4 transition ${
//           error ? "border-red-500" : "border-gray-300 hover:border-blue-500"
//         }`}
//       >
//         <input
//           type="file"
//           accept=".pdf,.jpg,.jpeg,.png"
//           onChange={handleChange}
//           className="text-sm"
//         />
//         {value ? (
//           <div className="mt-3 text-xs text-gray-700 flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
//             <span className="truncate max-w-[80%]">{value.name}</span>
//             <button
//               type="button"
//               className="text-red-600 font-semibold"
//               onClick={() => onChange(null)}
//             >
//               Remove
//             </button>
//           </div>
//         ) : (
//           <p className="mt-2 text-xs text-gray-500">No file selected</p>
//         )}
//       </div>
//       {error && <span className="text-xs text-red-600">{error}</span>}
//     </div>
//   );
// }




import { useMemo, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const steps = ["Personal", "Documents", "Banking", "Review"] as const;

const API_BASE_URL = import.meta.env.VITE_API_URL;

/** -------------------------------------------
 *  Helpers
 * ------------------------------------------*/
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isPhone(str: string): boolean {
  return /^(?:\+91|0)?[6-9]\d{9}$/.test(str.trim());
}

function isURL(str: string): boolean {
  if (!str) return true;
  try {
    new URL(str.startsWith("http") ? str : "http://" + str);
    return /\./.test(str) && !/\s/.test(str);
  } catch {
    return false;
  }
}

/**
 * ✅ IMPORTANT:
 * Do NOT use `instanceof File`
 * because it fails in APK WebView sometimes.
 */
function isValidUploadedFile(val: any): boolean {
  return (
    val &&
    typeof val === "object" &&
    typeof val.name === "string" &&
    typeof val.size === "number" &&
    val.size > 0
  );
}

type DocumentsState = {
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  photo: File | null;
  resume: File | null;
  certificate: File | null;
};

const initialDocs: DocumentsState = {
  aadhaarFront: null,
  aadhaarBack: null,
  photo: null,
  resume: null,
  certificate: null,
};

const FILE_FIELDS: (keyof DocumentsState)[] = [
  "aadhaarFront",
  "aadhaarBack",
  "photo",
  "resume",
  "certificate",
];

/** -------------------------------------------
 *  Form schema (ONLY string fields)
 * ------------------------------------------*/
const formSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  email: z.string().min(1, "Email is required").refine(isEmail, "Invalid email address"),
  fathersName: z.string().min(1, "Father's Name is required"),
  mobile1: z.string().min(1, "Mobile Number 1 is required").refine(isPhone, "Invalid mobile number"),
  mobile2: z.string().optional().refine((v) => !v || isPhone(v), "Invalid mobile number"),

  address: z.string().min(5, "Address is required"),
  reference: z.string().min(1, "Reference is required"),
  specializations: z.string().min(2, "Specializations are required"),
  experienceYears: z
    .string()
    .min(1, "Experience is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, "Experience must be 0-100"),

  accountHolder: z.string().min(1, "Account Holder is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  ifsc: z.string().min(1, "IFSC is required").regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC"),
  accountNumber: z.string().min(1, "Account Number is required"),
  upi: z.string().min(1, "UPI is required"),

  linkedin: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  twitter: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  facebook: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  instagram: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  youtube: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  website: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  portfolio: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  blog: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),

  remarks: z.string().optional(),
});

type FormFields = z.infer<typeof formSchema>;

/** -------------------------------------------
 *  Step fields mapping
 * ------------------------------------------*/
const stepFields: Record<number, (keyof FormFields)[]> = {
  1: [
    "fullName",
    "email",
    "fathersName",
    "mobile1",
    "address",
    "reference",
    "specializations",
    "experienceYears",
  ],
  3: ["accountHolder", "bankName", "ifsc", "accountNumber", "upi"],
};

export default function TherapistRegistration() {
  const [step, setStep] = useState<number>(1);
  const [docs, setDocs] = useState<DocumentsState>(initialDocs);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    getValues,
    trigger,
    formState: { errors },
    reset,
  } = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      fathersName: "",
      mobile1: "",
      mobile2: "",
      address: "",
      reference: "",
      specializations: "",
      experienceYears: "",

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

      remarks: "",
    },
    mode: "onChange",
  });

  const docErrors = useMemo(() => {
    const errs: Partial<Record<keyof DocumentsState, string>> = {};
    FILE_FIELDS.forEach((f) => {
      if (!isValidUploadedFile(docs[f])) errs[f] = "Required";
    });
    return errs;
  }, [docs]);

  function updateDoc(key: keyof DocumentsState, file: File | null) {
    setDocs((prev) => ({ ...prev, [key]: file }));
  }

  async function next() {
    if (step === 1) {
      const ok = await trigger(stepFields[1]);
      if (!ok) {
        toast.error("Please fix the personal details errors.", { position: "top-center" });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const anyMissing = FILE_FIELDS.some((f) => !isValidUploadedFile(docs[f]));
      if (anyMissing) {
        toast.error("Please upload all required documents.", { position: "top-center" });
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      const ok = await trigger(stepFields[3]);
      if (!ok) {
        toast.error("Please fix the bank details errors.", { position: "top-center" });
        return;
      }
      setStep(4);
      return;
    }
  }

  function previous() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    // Validate everything before submit
    const ok = await trigger();
    if (!ok) {
      toast.error("Please correct the form errors before submitting.", { position: "top-center" });
      return;
    }

    const anyMissing = FILE_FIELDS.some((f) => !isValidUploadedFile(docs[f]));
    if (anyMissing) {
      toast.error("Please upload all required documents.", { position: "top-center" });
      return;
    }

    const values = getValues();

    const payload = new FormData();
    Object.entries(values).forEach(([k, v]) => payload.append(k, v ?? ""));

    FILE_FIELDS.forEach((k) => {
      const file = docs[k];
      if (file) payload.append(k, file);
    });

    const apiUrl =
      (API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "") + "/api/admin/therapist";

    try {
      setIsSubmitting(true);

      const res = await fetch(apiUrl, {
        method: "POST",
        body: payload,
      });

      if (res.status === 201) {
        toast.success("Therapist registered successfully!", {
          position: "top-center",
          autoClose: 1500,
        });

        reset();
        setDocs(initialDocs);
        setStep(1);

        setTimeout(() => {
          window.location.href = "/admin";
        }, 1600);

        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {}

      toast.error(
        `Failed to register therapist.${data?.error ? ` Error: ${data.error}` : ""}`,
        { position: "top-center", autoClose: 4000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-50 flex items-center justify-center p-6">
      <ToastContainer />
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Therapist Registration
        </h1>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
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
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Section title="Personal Information">
                <Input label="Full Name *" error={errors.fullName?.message} {...register("fullName")} />
                <Input label="Email *" error={errors.email?.message} {...register("email")} />
                <Input label="Father's Name *" error={errors.fathersName?.message} {...register("fathersName")} />
                <Input label="Mobile Number 1 *" error={errors.mobile1?.message} {...register("mobile1")} />
                <Input label="Mobile Number 2" error={errors.mobile2?.message} {...register("mobile2")} />
                <Input label="Full Address *" error={errors.address?.message} {...register("address")} />
                <Input label="Reference *" error={errors.reference?.message} {...register("reference")} />
                <Input label="Specializations *" error={errors.specializations?.message} {...register("specializations")} />
                <Input label="Years of Experience *" error={errors.experienceYears?.message} {...register("experienceYears")} />
              </Section>
            )}

            {step === 2 && (
              <Section title="Document Upload">
                <FilePicker
                  label="Aadhaar Card (Front) *"
                  file={docs.aadhaarFront}
                  error={docErrors.aadhaarFront}
                  onChange={(f) => updateDoc("aadhaarFront", f)}
                />
                <FilePicker
                  label="Aadhaar Card (Back) *"
                  file={docs.aadhaarBack}
                  error={docErrors.aadhaarBack}
                  onChange={(f) => updateDoc("aadhaarBack", f)}
                />
                <FilePicker
                  label="Current Photo *"
                  file={docs.photo}
                  error={docErrors.photo}
                  onChange={(f) => updateDoc("photo", f)}
                />
                <FilePicker
                  label="Latest Resume *"
                  file={docs.resume}
                  error={docErrors.resume}
                  onChange={(f) => updateDoc("resume", f)}
                />
                <FilePicker
                  label="RCI / OT / PT Certificate *"
                  file={docs.certificate}
                  error={docErrors.certificate}
                  onChange={(f) => updateDoc("certificate", f)}
                />
              </Section>
            )}

            {step === 3 && (
              <>
                <Section title="Bank Details">
                  <Input label="Account Holder Name *" error={errors.accountHolder?.message} {...register("accountHolder")} />
                  <Input label="Bank Name *" error={errors.bankName?.message} {...register("bankName")} />
                  <Input label="IFSC Code *" error={errors.ifsc?.message} {...register("ifsc")} />
                  <Input label="Account Number *" error={errors.accountNumber?.message} {...register("accountNumber")} />
                  <Input label="UPI Address *" error={errors.upi?.message} {...register("upi")} />
                </Section>

                <div className="mt-10" />

                <Section title="Web Links (Optional)">
                  <Input label="LinkedIn URL" error={errors.linkedin?.message} {...register("linkedin")} />
                  <Input label="Twitter URL" error={errors.twitter?.message} {...register("twitter")} />
                  <Input label="Facebook URL" error={errors.facebook?.message} {...register("facebook")} />
                  <Input label="Instagram URL" error={errors.instagram?.message} {...register("instagram")} />
                  <Input label="YouTube URL" error={errors.youtube?.message} {...register("youtube")} />
                  <Input label="Website URL" error={errors.website?.message} {...register("website")} />
                  <Input label="Portfolio URL" error={errors.portfolio?.message} {...register("portfolio")} />
                  <Input label="Blog URL" error={errors.blog?.message} {...register("blog")} />
                </Section>
              </>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Section2 title="Review & Submit">
                  <div className="bg-slate-50 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Personal</h3>
                      <Detail label="Full Name" value={getValues("fullName")} />
                      <Detail label="Email" value={getValues("email")} />
                      <Detail label="Father's Name" value={getValues("fathersName")} />
                      <Detail label="Mobile 1" value={getValues("mobile1")} />
                      <Detail label="Mobile 2" value={getValues("mobile2") || "-"} />
                      <Detail label="Address" value={getValues("address")} />
                      <Detail label="Reference" value={getValues("reference")} />
                      <Detail label="Specializations" value={getValues("specializations")} />
                      <Detail label="Experience" value={getValues("experienceYears")} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Bank</h3>
                      <Detail label="Account Holder" value={getValues("accountHolder")} />
                      <Detail label="Bank Name" value={getValues("bankName")} />
                      <Detail label="IFSC" value={getValues("ifsc")} />
                      <Detail label="Account No." value={getValues("accountNumber")} />
                      <Detail label="UPI" value={getValues("upi")} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Documents</h3>
                      <Detail label="Aadhaar Front" value={docs.aadhaarFront?.name || "Not uploaded"} />
                      <Detail label="Aadhaar Back" value={docs.aadhaarBack?.name || "Not uploaded"} />
                      <Detail label="Photo" value={docs.photo?.name || "Not uploaded"} />
                      <Detail label="Resume" value={docs.resume?.name || "Not uploaded"} />
                      <Detail label="Certificate" value={docs.certificate?.name || "Not uploaded"} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Links</h3>
                      <Detail label="LinkedIn" value={getValues("linkedin") || "-"} />
                      <Detail label="Twitter" value={getValues("twitter") || "-"} />
                      <Detail label="Facebook" value={getValues("facebook") || "-"} />
                      <Detail label="Instagram" value={getValues("instagram") || "-"} />
                      <Detail label="YouTube" value={getValues("youtube") || "-"} />
                      <Detail label="Website" value={getValues("website") || "-"} />
                      <Detail label="Portfolio" value={getValues("portfolio") || "-"} />
                      <Detail label="Blog" value={getValues("blog") || "-"} />
                    </div>
                  </div>

                  <div className="mt-8">
                    <label className="font-semibold mb-2 block text-gray-700">Internal Remarks</label>
                    <textarea
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="Internal remarks"
                      {...register("remarks")}
                    />
                  </div>
                </Section2>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button
            disabled={step === 1 || isSubmitting}
            onClick={previous}
            className="px-4 py-2 rounded-lg border disabled:opacity-40"
          >
            Previous
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg shadow disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** -------------------------------------------
 * UI Components
 * ------------------------------------------*/
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Section2({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col mb-1 relative">
      <label className="text-sm text-gray-600 mb-1">{label}</label>
      <input
        {...props}
        className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && <span className="text-xs mt-1 text-red-600">{error}</span>}
    </div>
  );
}

function FilePicker({
  label,
  file,
  error,
  onChange,
}: {
  label: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
    e.currentTarget.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div
        className={`border-2 border-dashed rounded-xl p-4 transition ${
          error ? "border-red-500" : "border-gray-300 hover:border-blue-500"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handle}
          className="text-sm"
        />

        {file ? (
          <div className="mt-3 text-xs text-gray-700 flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <span className="truncate max-w-[80%]">{file.name}</span>
            <button type="button" className="text-red-600 font-semibold" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">No file selected</p>
        )}
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

import { ReactNode } from "react";

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center mb-2">
      <span className="font-medium text-gray-700 w-40">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
