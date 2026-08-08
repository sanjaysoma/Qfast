import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { getPatientAppointments, rateAppointment }
from "../services/patientService";

function MyAppointments() {

  const patientToken = sessionStorage.getItem("patient_token");

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [ratingInput, setRatingInput] =
    useState({});

  const [submittingRating, setSubmittingRating] =
    useState(false);

  // =========================
  // Fetch Logged In Patient Appointments
  // =========================

  const fetchAppointments = async () => {

    try {

      // Get patient ID from sessionStorage

      const patientId = sessionStorage.getItem(
        "patient_id"
      );

      console.log(
        "Patient ID:",
        patientId
      );

      // Fetch appointments

      const data =
        await getPatientAppointments(
          patientId
        );

      console.log(
        "Appointments:",
        data
      );

      setAppointments(data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  const handleRatingSubmit = async (appointmentId) => {
    const patientId = sessionStorage.getItem("patient_id");
    const rating = ratingInput[appointmentId];

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5");
      return;
    }

    try {
      setSubmittingRating(true);
      await rateAppointment(appointmentId, patientId, rating);
      await fetchAppointments();
      setRatingInput((prev) => ({
        ...prev,
        [appointmentId]: ""
      }));
      alert("Thank you for rating your doctor.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Could not submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  // =========================
  // Auto Refresh Appointments
  // =========================

  useEffect(() => {
    if (!patientToken) return;

    let cancelled = false;

    const loadAppointments = async () => {
      try {
        const patientId = sessionStorage.getItem("patient_id");

        console.log(
          "Patient ID:",
          patientId
        );

        const data = await getPatientAppointments(patientId);

        console.log(
          "Appointments:",
          data
        );

        if (!cancelled) {
          setAppointments(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    const interval = setInterval(() => {
      loadAppointments();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [patientToken]);

  // Redirect to login if not authenticated
  if (!patientToken) {
    return <Navigate to="/login" replace />;
  }

  // =========================
  // Loading State
  // =========================

  if (loading) {
    return (
      <h1 className="mt-10 text-center text-2xl">

        Loading Appointments...

      </h1>
    );
  }

  // =========================
  // UI
  // =========================

  return (

    <div className="min-h-screen bg-gray-100 px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8">

      <div className="mx-auto w-full max-w-6xl">

      <h1 className="mb-8 text-3xl font-bold text-blue-700 sm:text-4xl">

        My Appointments

      </h1>

      {/* No Appointments */}

      {appointments.length === 0 && (

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="text-xl font-semibold">

            No appointments found

          </h2>

        </div>
      )}

      {/* Appointments */}

      <div className="space-y-6">

        {appointments.map((appointment) => (

          <div
            key={appointment.id}
            className="rounded-2xl bg-white p-6 shadow-lg"
          >

            <h2 className="mb-3 text-2xl font-semibold">

              My Appointment

            </h2>

            <p className="mb-2 break-words">

              Doctor:
              {" "}
              {appointment.doctor?.name || appointment.doctor_id}

            </p>

            <p className="mb-2 break-words">

              Date:
              {" "}
              {appointment.appointment_date}

            </p>

            <p className="mb-2 break-words">

              Time:
              {" "}
              {appointment.appointment_time}

            </p>

            <p className="mb-4 break-words">

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
                    : appointment.status === "completed"
                      ? "text-blue-600 font-bold"
                      : "text-yellow-600 font-bold"
                }
              >

                {appointment.status}

              </span>

            </p>

            <p className="mb-2 break-words">

              Symptoms:
              {" "}
              {appointment.symptoms}

            </p>

            {/* Confirmed Appointment Details */}

            {appointment.status ===
              "confirmed" && (

              <div className="rounded-xl bg-blue-100 p-4">

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

                <p className="mt-3 text-sm text-red-600 font-semibold">
                  NOTE - Please try to reach Hospital by 10 minutes before
                </p>

              </div>

            )}

            {appointment.status === "completed" && (
              <div className="bg-emerald-50 p-4 rounded-xl">
                <p className="font-semibold text-slate-800 mb-3">
                  How was your consultation with Dr. {appointment.doctor?.name}?
                </p>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm font-medium">Rating:</label>
                  <select
                    value={ratingInput[appointment.id] || ""}
                    onChange={(e) =>
                      setRatingInput((prev) => ({
                        ...prev,
                        [appointment.id]: Number(e.target.value)
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm sm:w-auto sm:py-2"
                  >
                    <option value="">Select rating</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value} Star{value > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleRatingSubmit(appointment.id)}
                  disabled={submittingRating}
                  className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:py-2"
                >
                  {submittingRating ? "Submitting..." : "Submit Rating"}
                </button>
                {appointment.rating != null && (
                  <p className="mt-3 text-sm text-slate-700">
                    Your rating: <span className="font-semibold">{appointment.rating} / 5</span>
                  </p>
                )}
              </div>
            )}

          </div>

        ))}

      </div>

      </div>

    </div>
  );
}

export default MyAppointments;