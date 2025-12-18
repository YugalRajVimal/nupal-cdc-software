
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

import SubAdminList from "./VendorsList";

const SupervisorAllVendors = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Onboarded Vendors" />
      <div className="space-y-6">
        {/* <ComponentCard title="Sub Admins"> */}
        <SubAdminList />
        {/* </ComponentCard> */}
      </div>
    </div>
  );
};

export default SupervisorAllVendors;
