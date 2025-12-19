import SignUpForm from "../../../../components/auth/SubAdmin/SignUpForm";
import PageMeta from "../../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
     <PageMeta
        title="Nupal CDC"
        description="Admin and Sub-Admin Panel for Nupal CDC"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
