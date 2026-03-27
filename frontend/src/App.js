import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import HRDashboard from "./components/hr/HRDashboard";
import EmployeeDashboard from "./components/employee/EmployeeDashboard";
import SetPassword from "./pages/SetPassword";
import Hierarchy from "./components/hr/hierarchy";
import HRLayout from "./components/hr/HRlayout";
import EmployeesPage from "./components/hr/EmployeesPage";
import { ToastContainer } from "react-toastify";
import TeamAchievements from "./components/employee/TeamAchievements";
import LearningPathsPage from "./components/hr/skills";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompanyRequest from "./pages/companyRequest";




function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Login />} />
        <Route path="/request-access" element={<CompanyRequest />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/hr/employees" element={<EmployeesPage />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/employee-profile/:employeeName" element={<EmployeeDashboard />} />
        <Route path="/hre" element={<HRLayout />}></Route>
        <Route path="/hr/skills" element={<LearningPathsPage />} />
        <Route path="/hr/hierarchy" element={<Hierarchy />} />
        <Route path="/employee/achievements" element={<TeamAchievements/>}/>
        
      </Routes>
    </Router>
  );
}

export default App;