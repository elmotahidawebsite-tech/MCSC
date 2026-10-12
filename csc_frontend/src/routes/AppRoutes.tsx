import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import UserDashboard from "../pages/user/Dashboard";
import DashboardLayout from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { ROLES } from "../constants/roles";
import Users from "../pages/admin/Users/Users";
import Cases from "../pages/admin/Cases";
import Settings from "../pages/admin/Settings/Settings";
import CaseInfo from "../pages/user/ciriminal/CaseInfo";
import VictimsSuspectsReporters from "../pages/user/ciriminal/VictimsSuspectsReporters";
import Evidence from "../pages/user/ciriminal/Evidence";
import Review from "../pages/user/ciriminal/Review";
import AdminCaseDetail from "../pages/admin/criminal/CaseDetail";
import Unauthorized from "../pages/Unauthorized";
import CorpsesCaseInfo from "../pages/user/corpses/CorpsesCaseInfo";
import CorpsesSpecifications from "../pages/user/corpses/CorpsesSpecifications";
import CorpsesReview from "../pages/user/corpses/CorpsesReview";
import CivilCaseInfo from "../pages/user/civil/civilCaseInfo";
import CivilReview from "../pages/user/civil/CivilReview";
import AdminCriminalReview from "../pages/admin/criminal/CriminalReview";
import AdminCivilReview from "../pages/admin/civil/CivilReview";
import AdminCorpsesReview from "../pages/admin/corpses/CorpsesReview";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Admin */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/users"
              element={<Users />}
            />

            <Route
              path="/admin/cases"
              element={<Cases />}
            />

            <Route
              path="/admin/cases/:id"
              element={<AdminCaseDetail />}
            />

            {/* Admin Review Routes for different case types */}
            <Route
              path="/admin/cases/:caseId/criminal/review"
              element={<AdminCriminalReview />}
            />
            
            <Route
              path="/admin/cases/:caseId/civil/review"
              element={<AdminCivilReview />}
            />
            
            <Route
              path="/admin/cases/:caseId/corpses/review"
              element={<AdminCorpsesReview />}
            />

            <Route
              path="/admin/settings"
              element={<Settings />}
            />
          </Route>

          {/* User */}
          <Route element={<RoleRoute allowedRoles={[ROLES.OFFICER]} />}>
            <Route
              path="/user/dashboard"
              element={<UserDashboard />}
            />
            <Route
              path="/user/cases/info"
              element={<CaseInfo />}
            />
            <Route
              path="/user/cases/victims-suspects-reporters"
              element={<VictimsSuspectsReporters />}
            />
            <Route
              path="/user/cases/evidence"
              element={<Evidence />}
            />
            <Route
              path="/user/cases/review"
              element={<Review />}
            />

            {/* User - Corpses Case Flow (3 steps) */}
            <Route
              path="/user/corpses/info"
              element={<CorpsesCaseInfo />}
            />
            <Route
              path="/user/corpses/specifications"
              element={<CorpsesSpecifications />}
            />
            <Route
              path="/user/corpses/review"
              element={<CorpsesReview />}
            />

            {/* User - Civil Case Flow (2 steps - info + review) */}
            <Route
              path="/user/civil/info"
              element={<CivilCaseInfo />}
            />
            <Route
              path="/user/civil/review"
              element={<CivilReview />}
            />
          </Route>

        </Route>
      </Route>

      {/* Home */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={<h1>404 - Page Not Found</h1>}
      />
      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}