import API from "../api/axios";

export const bookAppointment = async (appointmentData) => {

  const response = await API.post(
    "/appointment/book",
    appointmentData
  );

  return response.data;
};