import API from "../api/axios";

export const getDoctorNotifications = async (doctorId) => {
  const response = await API.get(`/notification/doctor/${doctorId}`);
  return response.data;
};

export const getPatientNotifications = async (patientId) => {
  const response = await API.get(`/notification/patient/${patientId}`);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await API.put(`/notification/mark-read/${notificationId}`);
  return response.data;
};
