import API from "../api/axios";

export const getPatientAppointments = async (
  patientId
) => {

  const response = await API.get(
    `/appointment/patient/${patientId}`
  );

  return response.data;
};

export const rateAppointment = async (
  appointmentId,
  patientId,
  rating
) => {
  const response = await API.put(
    `/appointment/rate/${appointmentId}?patient_id=${encodeURIComponent(patientId)}&rating=${encodeURIComponent(rating)}`
  );
  return response.data;
};

export const updatePatient = async (patientId, patientData) => {
  const response = await API.put(`/patient/${patientId}`, patientData);
  return response.data;
};