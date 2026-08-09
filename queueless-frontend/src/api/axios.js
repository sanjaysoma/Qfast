import axios from "axios";

const runtimeBaseURL =
  (typeof window !== "undefined" && (window.__VDocQ_API_BASE_URL__ || window.__QFast_API_BASE_URL__)) ||
  (typeof window !== "undefined" && window.localStorage?.getItem("api_base_url")) ||
  "";

let envBaseURL = import.meta.env.VITE_API_BASE_URL || "";

// In production, ignore localhost URLs that were accidentally baked into build from local .env
if (import.meta.env.PROD && (envBaseURL.includes("localhost") || envBaseURL.includes("127.0.0.1"))) {
  console.warn(
    "[VDocQ API] Localhost VITE_API_BASE_URL ignored in production. Please set VITE_API_BASE_URL to your live backend server URL."
  );
  envBaseURL = "";
}

const resolveBaseURL = () => {
  if (runtimeBaseURL) return runtimeBaseURL;
  if (envBaseURL) return envBaseURL;
  if (import.meta.env.DEV) return "http://localhost:8000";
  return "";
};

const baseURL = resolveBaseURL();

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

