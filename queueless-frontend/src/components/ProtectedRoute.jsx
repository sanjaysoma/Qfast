import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
    const currentRole = sessionStorage.getItem("current_role");
    const patientToken = sessionStorage.getItem("patient_token");
    const doctorToken = sessionStorage.getItem("doctor_token");
    const location = useLocation();

    // Determine which token to check based on required role or current role
    const requiredRole = role || currentRole;
    const token = requiredRole === "doctor" ? doctorToken : patientToken;

    // User not logged in for this role
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Wrong role trying to access page
    if (role && role !== currentRole) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;