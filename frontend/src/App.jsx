import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import { Notice } from './components/ui';
import {
  ForgotPassword,
  Login,
  Register,
  ResetPassword,
} from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directories';
import {
  ClinicDetail,
  MedicationDetail,
  OwnerDetail,
  PetDetail,
  VisitDetail,
} from './pages/Details';
import { Account, AuditHistory } from './pages/Account';
import RecordForm from './forms/RecordForm';

function ProtectedRoute() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <div className="session-loading">
        <p role="status">Checking your Django session…</p>
      </div>
    );
  if (!auth.user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
function NotFound() {
  return (
    <Notice danger>
      This page could not be found. Use the navigation to return to a record
      list.
    </Notice>
  );
}
function recordRoutes() {
  return (
    <>
      <Route index element={<Dashboard />} />
      <Route path="owners" element={<Directory kind="owners" />} />
      <Route
        path="owners/new"
        element={<RecordForm key="owner-new" kind="owner" />}
      />
      <Route path="owners/:id" element={<OwnerDetail />} />
      <Route
        path="owners/:id/edit"
        element={<RecordForm key="owner-edit" kind="owner" />}
      />
      <Route path="pets" element={<Directory kind="pets" />} />
      <Route
        path="pets/new"
        element={<RecordForm key="pet-new" kind="pet" />}
      />
      <Route path="pets/:id" element={<PetDetail />} />
      <Route
        path="pets/:id/edit"
        element={<RecordForm key="pet-edit" kind="pet" />}
      />
      <Route path="clinics" element={<Directory kind="clinics" />} />
      <Route path="clinics/:id" element={<ClinicDetail />} />
      <Route
        path="clinics/:id/edit"
        element={<RecordForm key="clinic-edit" kind="clinic" />}
      />
      <Route path="visits" element={<Directory kind="visits" />} />
      <Route
        path="visits/new"
        element={<RecordForm key="visit-new" kind="visit" />}
      />
      <Route path="visits/:id" element={<VisitDetail />} />
      <Route
        path="visits/:id/edit"
        element={<RecordForm key="visit-edit" kind="visit" />}
      />
      <Route
        path="medications/new"
        element={<RecordForm key="medication-new" kind="medication" />}
      />
      <Route path="medications/:id" element={<MedicationDetail />} />
      <Route
        path="medications/:id/edit"
        element={<RecordForm key="medication-edit" kind="medication" />}
      />
      <Route path="account" element={<Account />} />
      <Route path="*" element={<NotFound />} />
    </>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          {recordRoutes()}
          <Route path="audit" element={<AuditHistory />} />
        </Route>
      </Route>
      <Route path="/preview" element={<AppLayout preview />}>
        {recordRoutes()}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
