import PageMeta from "../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Nupal CDC"
        description="Admin and Sub-Admin Panel for Nupal CDC"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
