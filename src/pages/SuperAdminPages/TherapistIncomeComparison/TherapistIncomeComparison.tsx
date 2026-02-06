import  { useEffect } from "react";
import axios from "axios";

const TherapistSalaryComparison = () => {
  useEffect(() => {
    // Fetch therapist salary vs session comparison from backend
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/therapist/salary-session-comparison`
        );
        console.log("Therapist Salary-Session Comparison:", response.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>TherapistSalaryComparison</div>
  );
};

export default TherapistSalaryComparison;