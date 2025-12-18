
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ExcelSheetsDetailedList from "./ExcelSheetDetailedList";

const SupervisorExcelSheetView = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Uploaded Milk Report" />
      <div className="space-y-6">
        {/* <ComponentCard title="Excel Sheet View"> */}
        <ExcelSheetsDetailedList />
        {/* </ComponentCard> */}
      </div>
    </div>
  );
};

export default SupervisorExcelSheetView;
