import { useEffect, useState } from "react";

import {
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment
}
from "../services/doctorAppointmentService";

function DoctorDashboard() {

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // =========================
  // Fetch Logged In Doctor Appointments
  // =========================

  const fetchAppointments = async () => {

    try {

      // Get logged in doctor ID

      const doctorId = sessionStorage.getItem(
        "doctor_id"
      );

      // Fetch only this doctor's appointments

      const data =
        await getDoctorAppointments(doctorId);

      setAppointments(data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // =========================
  // Approve Appointment
  // =========================

  const handleApprove = async (id) => {

    try {

      const doctorId = sessionStorage.getItem("doctor_id");
      await approveAppointment(id, doctorId);

      fetchAppointments();

    } catch (error) {

      console.log(error);
    }
  };

  // =========================
  // Reject Appointment
  // =========================

  const handleReject = async (id) => {

    try {

      const doctorId = sessionStorage.getItem("doctor_id");
      await rejectAppointment(id, doctorId);

      fetchAppointments();

    } catch (error) {

      console.log(error);
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <h1 className="mt-10 text-center text-2xl">
        Loading Appointments...
      </h1>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "pending"
  );
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.appointment_date === today &&
        appointment.status === "confirmed"
    )
    .sort((a, b) => {
      if (a.token_number && b.token_number) {
        return a.token_number - b.token_number;
      }
      return a.appointment_time.localeCompare(b.appointment_time);
    });
  const completedAppointments = appointments
    .filter((appointment) => appointment.status === "completed")
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time));

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-blue-700 sm:text-4xl">Doctor Dashboard</h1>
          <p className="mt-2 text-slate-600">View today’s upcoming appointments and completed visits.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => setShowUpcoming((current) => !current)}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/40 transition hover:bg-blue-700 sm:w-auto"
          >
            My Upcoming Appointments ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setShowCompleted((current) => !current)}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200/40 transition hover:bg-slate-800 sm:w-auto"
          >
            Completed Appointments ({completedAppointments.length})
          </button>
        </div>
      </div>

      {showUpcoming && (
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Today’s Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow">
              <p className="text-slate-600">No confirmed appointments for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-3xl bg-white p-6 shadow">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Patient</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {appointment.patient?.name || `Patient ${appointment.patient_id}`}
                      </p>
                      <p className="text-sm text-slate-600">
                        {appointment.patient?.age ? `Age ${appointment.patient.age}` : "Age unknown"}
                        {appointment.patient?.gender ? ` • ${appointment.patient.gender}` : ""}
                      </p>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Time:</span> {appointment.appointment_time}
                      </p>
                      <p>
                        <span className="font-semibold">Token:</span> {appointment.token_number || "TBD"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCompleted && (
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Completed Appointments</h2>
          {completedAppointments.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow">
              <p className="text-slate-600">No completed appointments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-3xl bg-white p-6 shadow">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Patient</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {appointment.patient?.name || `Patient ${appointment.patient_id}`}
                      </p>
                      <p className="text-sm text-slate-600">
                        {appointment.patient?.age ? `Age ${appointment.patient.age}` : "Age unknown"}
                        {appointment.patient?.gender ? ` • ${appointment.patient.gender}` : ""}
                      </p>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Date:</span> {appointment.appointment_date}
                      </p>
                      <p>
                        <span className="font-semibold">Time:</span> {appointment.appointment_time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingAppointments.length === 0 && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">No appointment requests pending approval.</h2>
          <p className="mt-2 text-gray-600">
            Once patients request appointments, they will appear here for approval or rejection.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {pendingAppointments.map((appointment) => (

          <div
            key={appointment.id}
            className="rounded-2xl bg-white p-6 shadow-lg"
          >

            <h2 className="mb-3 text-2xl font-semibold">

              Appointment

            </h2>

            <p className="mb-2">

              Patient:
              {" "}
              <span className="font-semibold text-blue-600">
                {appointment.patient?.name || `Patient ID: ${appointment.patient_id}`}
              </span>

            </p>

            {(appointment.patient?.age || appointment.patient?.gender) && (
              <p className="mb-2 text-gray-700">
                {appointment.patient?.age ? `Age: ${appointment.patient.age}` : ""}
                {appointment.patient?.age && appointment.patient?.gender ? ", " : ""}
                {appointment.patient?.gender ? `Gender: ${appointment.patient.gender}` : ""}
              </p>
            )}

            <p className="mb-2">

              Date:
              {" "}
              {appointment.appointment_date}

            </p>

            <p className="mb-2">

              Time:
              {" "}
              {appointment.appointment_time}

            </p>

            <p className="mb-4">

              Status:
              {" "}

              <span
                className={
                  appointment.status ===
                  "confirmed"
                    ? "text-green-600 font-bold"
                    : appointment.status ===
                      "rejected"
                    ? "text-red-600 font-bold"
                    : "text-yellow-600 font-bold"
                }
              >

                {appointment.status}

              </span>

            </p>

            <p className="mb-2">

              Symptoms:
              {" "}
              {appointment.symptoms}

            </p>

            {/* Pending Actions */}

            {appointment.status ===
              "pending" && (

                <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  onClick={() =>
                    handleApprove(
                      appointment.id
                    )
                  }
                  className="rounded-lg bg-green-600 px-4 py-3 text-white sm:py-2"
                >

                  Approve

                </button>

                <button
                  onClick={() =>
                    handleReject(
                      appointment.id
                    )
                  }
                  className="rounded-lg bg-red-600 px-4 py-3 text-white sm:py-2"
                >

                  Reject

                </button>

              </div>

            )}

            {/* Confirmed Appointment */}

            {appointment.status ===
              "confirmed" && (

              <div className="mt-4 rounded-xl bg-blue-100 p-4">

                <p>

                  🎫 Token:
                  {" "}
                  {appointment.token_number}

                </p>

                <p>

                  📍 Queue Position:
                  {" "}
                  {appointment.queue_position}

                </p>

                <p>

                  ⏱ Estimated Wait:
                  {" "}
                  {appointment.estimated_wait_time}
                  {" "}
                  mins

                </p>

              </div>

            )}

          </div>

        ))}

      </div>

      </div>
    </div>
  );
}

export default DoctorDashboard;