import API from "../api/axios";

export const getHospitals = async () => {
  const response = await API.get("/hospital/all");
  return response.data;
};

export const getHospitalById = async (id) => {
  const response = await API.get(`/hospital/${id}`);
  return response.data;
};

export const getNearbyHospitals = async (lat, lon) => {
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
    throw new Error("Location not available");
  }

  const response = await API.get(`/hospital/nearby?lat=${encodeURIComponent(parsedLat)}&lon=${encodeURIComponent(parsedLon)}`);
  return response.data;
};

export const getHospitalsByCity = async (city) => {
  const response = await API.get(`/hospital/city/${encodeURIComponent(city)}`);
  return response.data;
};

export const getHospitalsByDistrict = async (district) => {
  const response = await API.get(`/hospital/district/${encodeURIComponent(district)}`);
  return response.data;
};

export const searchHospitals = async (query) => {
  const response = await API.get(`/hospital/search?query=${encodeURIComponent(query)}`);
  return response.data;
};