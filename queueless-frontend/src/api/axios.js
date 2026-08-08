import axios from "axios";

const getOriginBasedBackendURL = () => {
  if (typeof window === "undefined" || !window.location?.hostname) {
    return "";
  }

  const { hostname, protocol } = window.location;
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "";
  }

  const backendProtocol = protocol === "https:" ? "https:" : "http:";
  return `${backendProtocol}//${hostname}:8000`;
};

const runtimeBaseURL =
  (typeof window !== "undefined" && window.__QFast_API_BASE_URL__) ||
  (typeof window !== "undefined" && window.localStorage?.getItem("api_base_url")) ||
  "";

const envBaseURL = import.meta.env.VITE_API_BASE_URL || "";

const baseURL =
  runtimeBaseURL ||
  envBaseURL ||
  getOriginBasedBackendURL() ||
  (import.meta.env.DEV ? "http://localhost:8000" : "https://your-production-api.com");

const API = axios.create({
  baseURL,
});

// Add request interceptor to include role-specific token
API.interceptors.request.use((config) => {
  const currentRole = sessionStorage.getItem("current_role");
  const patientToken = sessionStorage.getItem("patient_token");
  const doctorToken = sessionStorage.getItem("doctor_token");

  const token = currentRole === "doctor" ? doctorToken : patientToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;

