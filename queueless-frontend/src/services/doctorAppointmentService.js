import API from "../api/axios";

export const getDoctorAppointments =
  async (doctorId) => {

    const response = await API.get(
      `/appointment/doctor/${doctorId}`
    );

    return response.data;
};

export const approveAppointment =
  async (appointmentId, doctorId) => {

    const response = await API.put(
      `/appointment/approve/${appointmentId}?doctor_id=${doctorId}`
    );

    return response.data;
};

export const rejectAppointment =
  async (appointmentId, doctorId) => {

    const response = await API.put(
      `/appointment/reject/${appointmentId}?doctor_id=${doctorId}`
    );

    return response.data;
};