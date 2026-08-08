import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentLocation, getCityFromCoordinates } from "../services/locationService";
import { loadIndiaCities } from "../data/indiaCities";
import DISTRICTS from "../data/indiaDistricts";
import API from "../api/axios";
import LogoImg from "../assets/icon.png";
import {
  getDoctorNotifications,
  getPatientNotifications,
  markNotificationRead
} from "../services/notificationService";

function Navbar() {
  const location = useLocation();

  const patientToken = sessionStorage.getItem("patient_token");
  const doctorToken = sessionStorage.getItem("doctor_token");
  const currentRole = sessionStorage.getItem("current_role");
  const name = sessionStorage.getItem("name") || "";
  const patientId = sessionStorage.getItem("patient_id");
  const doctorId = sessionStorage.getItem("doctor_id");

  const hiddenNotificationStorageKey = (() => {
    const userId = currentRole === "doctor" ? doctorId : patientId;
    const roleKey = currentRole === "doctor" ? "doctor" : currentRole === "patient" ? "patient" : "guest";
    return `hidden_notifications_${roleKey}_${userId || "anonymous"}`;
  })();

  const readHiddenNotificationIds = () => {
    try {
      const stored = sessionStorage.getItem(hiddenNotificationStorageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to read hidden notifications", err);
      return [];
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState(() => readHiddenNotificationIds());
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const notificationButton = document.querySelector('[data-notification-toggle]');
      const notificationPanel = document.querySelector('[data-notification-panel]');
      const profileButton = document.querySelector('[data-profile-toggle]');
      const profilePanel = document.querySelector('[data-profile-panel]');

      const clickedInsideDropdown =
        (notificationPanel && notificationPanel.contains(event.target)) ||
        (profilePanel && profilePanel.contains(event.target)) ||
        (notificationButton && notificationButton.contains(event.target)) ||
        (profileButton && profileButton.contains(event.target));

      if (!clickedInsideDropdown) {
        setShowNotifications(false);
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!patientToken && !doctorToken) {
      setNotifications([]);
      return;
    }

    setLoadingNotifications(true);
    try {
      if (currentRole === "doctor" && doctorId) {
        const data = await getDoctorNotifications(doctorId);
        setNotifications(data.filter((item) => !hiddenNotificationIds.includes(item.id)));
      } else if (currentRole === "patient" && patientId) {
        const data = await getPatientNotifications(patientId);
        setNotifications(data.filter((item) => !hiddenNotificationIds.includes(item.id)));
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [currentRole, doctorId, patientId, patientToken, doctorToken, hiddenNotificationIds]);

  useEffect(() => {
    try {
      sessionStorage.setItem(hiddenNotificationStorageKey, JSON.stringify(hiddenNotificationIds));
    } catch (err) {
      console.error("Failed to save hidden notifications", err);
    }
  }, [hiddenNotificationIds, hiddenNotificationStorageKey]);

  useEffect(() => {
    if (!showNotifications) return;

    let isCancelled = false;
    const load = async () => {
      await fetchNotifications();
      if (!isCancelled && showNotifications) {
        // no-op: keep the current list stable after the first load
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [fetchNotifications, showNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
      } catch (err) {
        console.error("Failed to mark notification read", err);
      }
    }
    fetchNotifications();
  };

  const handleRemoveNotification = (notificationId) => {
    setHiddenNotificationIds((prev) => (prev.includes(notificationId) ? prev : [...prev, notificationId]));
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const handleLogout = () => {
    sessionStorage.clear();
    // Clear both session and local storage to fully log out
    try {
      localStorage.clear();
    } catch {
      localStorage.removeItem("patient_token");
      localStorage.removeItem("doctor_token");
      localStorage.removeItem("patient_id");
      localStorage.removeItem("doctor_id");
      localStorage.removeItem("name");
    }
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!ok) return;

    try {
      const id = currentRole === "doctor" ? doctorId : patientId;
      await API.delete(`/auth/delete/${id}`);
      alert("Account deleted");
      handleLogout();
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
    }
  };

  const isLoggedIn = patientToken || doctorToken;
  const selectedCity = sessionStorage.getItem("selected_city") || sessionStorage.getItem("current_city") || "All Cities";

  const getDoctorsLink = () => {
    if (selectedCity && selectedCity !== "All Cities") {
      return `/doctors?city=${encodeURIComponent(selectedCity)}`;
    }
    return "/doctors";
  };

  const getHospitalsLink = () => {
    if (selectedCity && selectedCity !== "All Cities") {
      return `/hospitals?city=${encodeURIComponent(selectedCity)}`;
    }
    return "/hospitals";
  };

  const isActive = (route) => {
    if (!location || !location.pathname) return false;
    if (route === "/") return location.pathname === "/";
    return location.pathname === route || location.pathname.startsWith(route + "/");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/70 bg-[#020c2a]/95 px-4 py-2 shadow-sm backdrop-blur-xl md:px-6 md:py-2.5">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2.5 md:gap-3">
        <div className="flex min-w-0 flex-col items-start gap-0.5 md:flex-row md:items-center md:gap-3">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-1 font-bold text-white">
            <img src={LogoImg} alt="QFast Logo" className="h-14 w-14 shrink-0 rounded-lg object-contain sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]" />
            <span className="text-[1rem] tracking-tight sm:text-[1.1rem] md:text-[1.25rem]">QFast</span>
          </Link>
          <div className="flex min-w-0 items-start text-sm text-slate-300 md:items-center md:self-center">
            <CityDisplay />
          </div>
        </div>

        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          <Link to="/" className={`text-sm font-medium pb-1 ${isActive('/') ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-slate-300'} hover:text-cyan-300`}>Home</Link>
          <Link to={getDoctorsLink()} className={`text-sm font-medium pb-1 ${isActive('/doctors') ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-slate-300'} hover:text-cyan-300`}>Doctors</Link>
          <Link to={getHospitalsLink()} className={`text-sm font-medium pb-1 ${isActive('/hospitals') ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-slate-300'} hover:text-cyan-300`}>Hospitals</Link>
          <Link to="/nearby-hospitals" className={`text-sm font-medium pb-1 ${isActive('/nearby-hospitals') ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-slate-300'} hover:text-cyan-300`}>Nearby</Link>
          {currentRole === "patient" && (
            <Link to="/my-appointments" className="text-sm font-medium text-slate-300 hover:text-cyan-300">My Appointments</Link>
          )}
          {currentRole === "doctor" && (
            <Link to="/doctor-dashboard" className="text-sm font-medium text-slate-300 hover:text-cyan-300">Doctor Dashboard</Link>
          )}
          {isLoggedIn && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <div className="relative">
                <button
                  data-notification-toggle
                  onMouseDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  onClick={() => setShowNotifications((s) => !s)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50/10 text-lg text-slate-200 transition hover:bg-slate-50/20"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[0.6rem] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    data-notification-panel
                    onMouseDown={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    className="absolute right-0 top-11 z-50 w-[min(92vw,20rem)] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-sm font-semibold text-slate-900">Notifications</span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-sm text-slate-500 hover:text-slate-800"
                      >
                        Close
                      </button>
                    </div>
                    {loadingNotifications ? (
                      <p className="text-sm text-slate-500">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-sm text-slate-600">No notifications yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start justify-between gap-2 rounded-2xl px-4 py-3 transition ${notification.is_read ? "bg-slate-50" : "bg-slate-100"}`}
                          >
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-slate-800">{notification.message}</p>
                                {!notification.is_read && (
                                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <p className="mt-2 text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveNotification(notification.id);
                              }}
                              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700"
                              aria-label="Cancel notification"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  data-profile-toggle
                  onMouseDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  onClick={() => setOpen((s) => !s)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-600 bg-slate-800/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/20"
                >
                  <span className="text-xs">Hi, {name || (currentRole === 'patient' ? 'Patient' : 'Doctor')}</span>
                </button>

                {open && (
                  <div
                    data-profile-panel
                    onMouseDown={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    className="absolute right-0 mt-2 flex w-[min(92vw,12rem)] flex-col gap-1 rounded-3xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex h-11 w-full items-center justify-start whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Profile
                    </Link>
                    {currentRole === "patient" && (
                      <Link
                        to="/my-appointments"
                        onClick={() => setOpen(false)}
                        className="flex h-11 w-full items-center justify-start whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        My Appointments
                      </Link>
                    )}
                    {currentRole === "doctor" && (
                      <Link
                        to="/doctor-dashboard"
                        onClick={() => setOpen(false)}
                        className="flex h-11 w-full items-center justify-start whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Doctor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="flex h-11 w-full items-center justify-start whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleDeleteAccount();
                      }}
                      className="flex h-11 w-full items-center justify-start whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-slate-100"
                    >
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auth buttons for desktop */}
        {!isLoggedIn && (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-full border border-cyan-400 px-6 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-cyan-400 px-6 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
            >
              Register
            </Link>
            <Link
              to="/register-hospital"
              className="rounded-full bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200/40 transition hover:bg-[#1d4ed8]"
            >
              Register Hospital
            </Link>
          </div>
        )}

        {/* Mobile menu for logged-in users */}
        {isLoggedIn && (
          <div className="ml-auto flex items-center gap-2 md:hidden">
            {/* Notifications for mobile */}
            <div className="relative">
              <button
                data-notification-toggle
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onClick={() => setShowNotifications((s) => !s)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-50/10 text-sm text-slate-200 transition hover:bg-slate-50/20"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-3 min-w-[0.75rem] items-center justify-center rounded-full bg-red-600 px-0.5 text-[0.5rem] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  data-notification-panel
                  onMouseDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  className="absolute right-0 top-10 z-50 w-[min(92vw,18rem)] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-sm text-slate-500 hover:text-slate-800"
                    >
                      Close
                    </button>
                  </div>
                  {loadingNotifications ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="text-sm text-slate-600">No notifications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start justify-between gap-2 rounded-2xl px-4 py-3 transition ${notification.is_read ? "bg-slate-50" : "bg-slate-100"}`}
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-slate-800">{notification.message}</p>
                              {!notification.is_read && (
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveNotification(notification.id);
                            }}
                            className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700"
                            aria-label="Cancel notification"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu for mobile */}
            <div className="relative">
              <button
                data-profile-toggle
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onClick={() => setOpen((s) => !s)}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-600 bg-slate-800/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/20"
              >
                <span className="truncate">{name || (currentRole === 'patient' ? 'Patient' : 'Doctor')}</span>
              </button>

              {open && (
                <div
                  data-profile-panel
                  onMouseDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  className="absolute right-0 mt-2 w-[min(92vw,13rem)] rounded-3xl border border-slate-200 bg-white p-2.5 shadow-xl"
                >
                  <div className="flex flex-col gap-1.5">
                    <Link
                      to="/"
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Home
                    </Link>
                    <Link
                      to={getDoctorsLink()}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Doctors
                    </Link>
                    <Link
                      to={getHospitalsLink()}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Hospitals
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Profile
                    </Link>
                    {currentRole === "patient" && (
                      <Link
                        to="/my-appointments"
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                      >
                        My Appointments
                      </Link>
                    )}
                    {currentRole === "doctor" && (
                      <Link
                        to="/doctor-dashboard"
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Doctor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="flex min-h-12 w-full items-center rounded-2xl px-4 py-3 text-left text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleDeleteAccount();
                      }}
                      className="flex min-h-12 w-full items-center rounded-2xl px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-slate-100"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth buttons for mobile (non-logged-in) */}
        {!isLoggedIn && (
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 self-center md:hidden">
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-cyan-400 px-3 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 items-center justify-center rounded-full border border-cyan-400 px-3 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
            >
              Register
            </Link>
            <Link
              to="/register-hospital"
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#2563eb] px-3 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              Register Hospital
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function CityDisplay() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [city, setCity] = useState(() => sessionStorage.getItem("selected_city") || sessionStorage.getItem("current_city") || "Location not detected");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationWarning, setLocationWarning] = useState("");
  const [search, setSearch] = useState("");
  const [allCities, setAllCities] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const useLocalDistricts = true;

  const getStoredCity = () =>
    sessionStorage.getItem("selected_city") ||
    sessionStorage.getItem("current_city") ||
    "Location not detected";

  const getSelectedCitySource = () =>
    sessionStorage.getItem("selected_city_source") || "auto";

  useEffect(() => {
    const onStorage = () => {
      const nextCity = getStoredCity();
      setCity(nextCity);
      if (nextCity && nextCity !== "Location not detected") {
        setLocationError("");
        setLocationWarning("");
      }
    };

    // also update counts in navbar when city changes
    const notifyCounts = () => {
      const city = sessionStorage.getItem("selected_city") || sessionStorage.getItem("current_city") || "All Cities";
      window.dispatchEvent(new CustomEvent("navbarCityChanged", { detail: { city } }));
    };

    // Polling fallback for same-window changes
    const interval = setInterval(onStorage, 1500);
    window.addEventListener("cityChanged", onStorage);
    window.addEventListener("cityChanged", notifyCounts);
    // trigger once on mount
    notifyCounts();
    return () => {
      clearInterval(interval);
      window.removeEventListener("cityChanged", onStorage);
      window.removeEventListener("cityChanged", notifyCounts);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const detectLocationOnce = useCallback(async (force = false) => {
    setDetecting(true);
    setLocationError("");
    setLocationWarning("");
    try {
      const loc = await getCurrentLocation({
        minAccuracy: 5000,
        watchTimeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 10000,
        allowIpFallback: true,
      });
      try {
        console.info(
          "detectLocationOnce: got loc " +
            JSON.stringify({ loc, force, previous_selected: sessionStorage.getItem("selected_city") })
        );
      } catch {
        console.info("detectLocationOnce: got loc", { loc, force, previous_selected: sessionStorage.getItem("selected_city") });
      }
      const hasGoodAccuracy =
        loc.accuracy == null ||
        !Number.isFinite(Number(loc.accuracy)) ||
        Number(loc.accuracy) <= 3000;

      let name = loc.city || null;
      if (!name && loc.latitude != null && loc.longitude != null) {
        name = await getCityFromCoordinates(loc.latitude, loc.longitude, {
          preferArea: hasGoodAccuracy,
        });
        try {
          console.info("detectLocationOnce: reverse geocode name " + JSON.stringify({ name }));
        } catch {
          console.info("detectLocationOnce: reverse geocode name", { name });
        }
      }
      if (name) {
        if (loc.accuracy != null && Number.isFinite(Number(loc.accuracy)) && Number(loc.accuracy) > 5000) {
          setLocationWarning("Location found with low accuracy. Nearby results may be approximate.");
        }
        if (loc.latitude != null && loc.longitude != null) {
          sessionStorage.setItem("detected_latitude", String(loc.latitude));
          sessionStorage.setItem("detected_longitude", String(loc.longitude));
          if (loc.accuracy != null) {
            sessionStorage.setItem("detected_accuracy", String(loc.accuracy));
          } else {
            sessionStorage.removeItem("detected_accuracy");
          }
          sessionStorage.setItem("detected_source", String(loc.source || "unknown"));
        }

        const previousSelection = sessionStorage.getItem("selected_city");
        const selectedCitySource = getSelectedCitySource();
        sessionStorage.setItem("current_city", name);
        if (force || !previousSelection || previousSelection === "All Cities" || selectedCitySource !== "manual") {
          sessionStorage.setItem("selected_city", name);
          sessionStorage.setItem("selected_city_source", "auto");
          window.dispatchEvent(new Event("cityChanged"));
          setCity(name);
        } else {
          window.dispatchEvent(new Event("cityChanged"));
        }
      } else {
        if (loc.latitude != null && loc.longitude != null) {
          sessionStorage.setItem("detected_latitude", String(loc.latitude));
          sessionStorage.setItem("detected_longitude", String(loc.longitude));
          if (loc.accuracy != null) {
            sessionStorage.setItem("detected_accuracy", String(loc.accuracy));
          } else {
            sessionStorage.removeItem("detected_accuracy");
          }
          sessionStorage.setItem("detected_source", String(loc.source || "unknown"));
        }

        if (loc.accuracy != null && Number.isFinite(Number(loc.accuracy)) && Number(loc.accuracy) > 5000) {
          setLocationWarning("Location found with low accuracy. Nearby results may be approximate.");
        }

        const existingCity = getStoredCity();
        const selectedCitySource = getSelectedCitySource();
        if (selectedCitySource !== "manual") {
          sessionStorage.removeItem("selected_city");
          sessionStorage.removeItem("current_city");
          sessionStorage.removeItem("selected_city_source");
          setCity("Location not detected");
          window.dispatchEvent(new Event("cityChanged"));
        }
        if (!existingCity || existingCity === "Location not detected" || selectedCitySource !== "manual") {
          setLocationError("Location detected, but city could not be determined. Choose your city manually or retry detection.");
        }
      }
    } catch (err) {
      const existingCity = getStoredCity();
      const selectedCitySource = getSelectedCitySource();
      if (selectedCitySource !== "manual") {
        sessionStorage.removeItem("selected_city");
        sessionStorage.removeItem("current_city");
        sessionStorage.removeItem("selected_city_source");
        setCity("Location not detected");
        window.dispatchEvent(new Event("cityChanged"));
      }
      if (!existingCity || existingCity === "Location not detected" || selectedCitySource !== "manual") {
        setLocationError("Unable to detect location. Please allow browser location access and try again.");
      }
      console.error(err);
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    // try to detect once on mount (do not force override manual selection)
    const id = window.setTimeout(() => {
      void detectLocationOnce();
    }, 0);

    return () => {
      window.clearTimeout(id);
    };
  }, [detectLocationOnce]);

  const handleSelect = (v) => {
    sessionStorage.setItem("selected_city", v);
    sessionStorage.setItem("selected_city_source", "manual");
    setCity(v);
    setLocationError("");
    setLocationWarning("");
    window.dispatchEvent(new Event("cityChanged"));
    setOpen(false);
    navigate("/");
  };

  const handleManual = (v) => {
    const val = v.trim();
    if (!val) return;
    sessionStorage.setItem("selected_city", val);
    sessionStorage.setItem("selected_city_source", "manual");
    setCity(val);
    setLocationError("");
    setLocationWarning("");
    window.dispatchEvent(new Event("cityChanged"));
    setOpen(false);
    navigate("/");
  };

  const ensureCitiesLoaded = async () => {
    if (allCities) return;
    setLoadingCities(true);
    try {
      if (useLocalDistricts) {
        setAllCities(DISTRICTS);
      } else {
        const list = await loadIndiaCities();
        if (!list.includes("All Cities")) list.unshift("All Cities");
        setAllCities(list);
      }
    } catch (err) {
      console.error(err);
      setAllCities(DISTRICTS);
    } finally {
      setLoadingCities(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative flex w-fit items-center">
      <button onClick={async () => { setOpen((s) => !s); if (!open) await ensureCitiesLoaded(); }} className="inline-flex h-8 items-center gap-1 whitespace-nowrap text-xs leading-none text-white">
        <span>📍</span>
        <span className="max-w-[8rem] truncate sm:max-w-[10rem]">{detecting ? "Detecting..." : city}</span>
        <span className="ml-1">▾</span>
      </button>
      {(locationError || locationWarning) && !open && (
        <p className={`pointer-events-none absolute left-0 top-full mt-1 max-w-[16rem] text-[10px] leading-4 ${locationError ? "text-red-600" : "text-amber-500"}`}>
          {locationError || locationWarning}
        </p>
      )}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,18rem)] max-w-[calc(100vw-1rem)] rounded-md border bg-white p-2 shadow sm:w-64">
          <div className="px-2 py-1">
            <div className="flex items-center justify-between">
              <button onClick={() => detectLocationOnce(true)} className="text-xs text-slate-600 hover:underline">Detect location</button>
              <button onClick={() => { setOpen(false); }} className="text-xs text-slate-500">Close</button>
            </div>
            {(locationError || locationWarning) && (
              <p className={`text-[11px] mt-1 ${locationError ? "text-red-600" : "text-amber-500"}`}>
                {locationError || locationWarning}
              </p>
            )}
              <input
              placeholder="Search or type district"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          {loadingCities ? (
            <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Loading cities...</div>
          ) : (
            <div className="mt-2 max-h-96 space-y-2 overflow-auto pr-1 text-sm text-slate-700">
              {(search
                ? allCities?.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
                : allCities
              )?.map((cityOption) => (
                <button
                  key={cityOption}
                  onClick={() => handleSelect(cityOption)}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100"
                >
                  {cityOption}
                </button>
              ))}
              {search && (
                <button
                  onClick={() => handleManual(search)}
                  disabled={!search.trim()}
                  className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-2 text-left text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use "{search}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Navbar;


