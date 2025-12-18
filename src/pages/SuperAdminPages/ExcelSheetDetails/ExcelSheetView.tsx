
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ExcelSheetsDetailedList from "./ExcelSheetDetailedList";

const ExcelSheetView = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Excel Sheet View" />
      <div className="space-y-6">
        {/* <ComponentCard title="Excel Sheet View"> */}
        <ExcelSheetsDetailedList />
        {/* </ComponentCard> */}
      </div>
    </div>
  );
};

export default ExcelSheetView;
