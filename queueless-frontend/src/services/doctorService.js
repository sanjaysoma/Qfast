import API from "../api/axios";

export const getDoctors = async () => {
  const response = await API.get("/doctor/all");
  return response.data;
};

export const getSpecializations = async () => {
  const response = await API.get("/doctor/specializations");
  return response.data;
};

export const getSpecializationsNearby = async (lat, lon, max_km = 50) => {
  if (lat == null || lon == null) return getSpecializations();
  const response = await API.get(`/doctor/specializations?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&max_km=${encodeURIComponent(max_km)}`);
  return response.data;
};

export const getSpecializationsByCity = async (city) => {
  if (!city) return getSpecializations();
  const response = await API.get(`/doctor/specializations?city=${encodeURIComponent(city)}`);
  return response.data;
};

export const getDoctorsBySpecialization = async (specialization, lat, lon, city) => {
  const params = [];
  if (lat != null && lon != null) {
    params.push(`lat=${encodeURIComponent(lat)}`);
    params.push(`lon=${encodeURIComponent(lon)}`);
  }
  if (city) {
    params.push(`city=${encodeURIComponent(city)}`);
  }
  const query = params.length ? `?${params.join("&")}` : "";
  const response = await API.get(`/doctor/specialization/${encodeURIComponent(specialization)}${query}`);
  return response.data;
};

export const getNearbyDoctors = async (lat, lon) => {
  const response = await API.get(`/doctor/nearby?lat=${lat}&lon=${lon}`);
  return response.data;
};

export const getDoctorsByHospital = async (hospitalId) => {
  const response = await API.get(`/doctor/hospital/${hospitalId}`);
  return response.data;
};

export const getDoctorById = async (doctorId) => {
  const response = await API.get(`/doctor/${doctorId}`);
  return response.data;
};

export const updateDoctor = async (doctorId, doctorData) => {
  const response = await API.put(`/doctor/${doctorId}`, doctorData);
  return response.data;
};

export const getAvailableSlots = async (doctorId, appointmentDate) => {
  const response = await API.get(
    `/doctor/available-slots/${doctorId}?appointment_date=${encodeURIComponent(appointmentDate)}`
  );
  return response.data;
};