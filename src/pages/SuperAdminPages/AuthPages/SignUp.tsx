import PageMeta from "../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
     <PageMeta
        title="Dairy Management"
        description="Admin and Sub-Admin Panel for Dairy Management"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
