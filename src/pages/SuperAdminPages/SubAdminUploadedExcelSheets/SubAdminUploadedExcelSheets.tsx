import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ExcelSheetsList from "./ExcelSheetList";

const SubAdminUploadedExcelSheets = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Sub Admin's Excel Sheets" />
      <div className="space-y-6">
        <ExcelSheetsList />
      </div>
    </div>
  );
};

export default SubAdminUploadedExcelSheets;
