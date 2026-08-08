import { useLocation, useNavigate } from "react-router-dom";

const publicTabs = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Nearby", path: "/nearby-hospitals", icon: "📍" },
];

const patientTabs = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Appointments", path: "/my-appointments", icon: "📅" },
  { label: "Nearby", path: "/nearby-hospitals", icon: "📍" },
];

const doctorTabs = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Dashboard", path: "/doctor-dashboard", icon: "🩺" },
  { label: "Nearby", path: "/nearby-hospitals", icon: "📍" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = sessionStorage.getItem("current_role");
  const isLoggedIn = Boolean(
    sessionStorage.getItem("patient_token") || sessionStorage.getItem("doctor_token")
  );

  if (["/login", "/register", "/register-hospital"].includes(location.pathname)) {
    return null;
  }

  const tabs = !isLoggedIn
    ? publicTabs
    : currentRole === "doctor"
    ? doctorTabs
    : patientTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white p-2 shadow-soft md:hidden">
      <div className="flex items-center justify-between gap-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex-1 rounded-3xl border px-2 py-3 text-center text-xs font-semibold transition ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
                <div className="text-lg leading-none">{tab.icon}</div>
                <div className="mt-1 leading-tight">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
