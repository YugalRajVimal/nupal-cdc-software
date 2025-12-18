import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import UploadedAssetsDataTable from "./IssuedAssetsDataTable";

const AdminIssuedAssetsSheetView = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Issued Assets Report" />
      <div className="space-y-6">
        {/* <ComponentCard title="Excel Sheet View"> */}
        <UploadedAssetsDataTable />
        {/* </ComponentCard> */}
      </div>
    </div>
  );
};

export default AdminIssuedAssetsSheetView;
