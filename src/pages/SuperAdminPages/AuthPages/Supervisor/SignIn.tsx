
import SupervisorSignInForm from "../../../../components/auth/Supervisor/SignInForm";
import PageMeta from "../../../../components/common/PageMeta";
import SupervisorAuthLayout from "./AuthPageLayout";

export default function SupervisorSignIn() {
  return (
    <>
      <PageMeta
        title="Nupal CDC"
        description="Admin and Sub-Admin Panel for Nupal CDC"
      />
      <SupervisorAuthLayout>
        <SupervisorSignInForm />
      </SupervisorAuthLayout>
    </>
  );
}
