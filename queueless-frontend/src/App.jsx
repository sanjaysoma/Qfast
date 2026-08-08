import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import NearbyHospitals from "./pages/NearbyHospitals";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import DoctorDashboard from "./pages/DoctorDashboard";
import RegisterHospital from "./pages/RegisterHospital";
import MyAreaDoctors from "./pages/MyAreaDoctors";
import Profile from "./pages/Profile";
import QueueStatus from "./pages/QueueStatus";
import Faq from "./pages/Faq";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* PATIENT ROUTES */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="patient">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/specialization/:specialty" element={<Doctors />} />
        <Route path="/doctors" element={<Doctors />} />

        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/nearby-hospitals" element={<NearbyHospitals />} />
        <Route path="/hospital/:hospitalId" element={<HospitalDetails />} />

        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute role="patient">
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute role="patient">
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-area-doctors"
          element={
            <ProtectedRoute role="patient">
              <MyAreaDoctors />
            </ProtectedRoute>
          }
        />

        <Route path="/faq" element={<Faq />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/queue"
          element={
            <ProtectedRoute role="patient">
              <QueueStatus />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR ROUTES */}

        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-hospital"
          element={<RegisterHospital />}
        />
      </Routes>

      <BottomNav />
    </BrowserRouter>
  );
}

export default App;