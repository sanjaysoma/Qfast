import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";

import { bookAppointment }
from "../services/appointmentService";
import { getAvailableSlots } from "../services/doctorService";

function BookAppointment() {

  const location = useLocation();

  const doctor = location.state?.doctor;

  // =========================
  // Get Logged In Patient ID
  // =========================

  const patientId =
    sessionStorage.getItem("patient_id");

  // =========================
  // Form State
  // =========================

  const [formData, setFormData] =
    useState({

      patient_id: Number(patientId),

      doctor_id: doctor?.id,

      appointment_date: "",

      appointment_time: "",

      symptoms: "",
    });

  const [slotData, setSlotData] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [result, setResult] =
    useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctor?.id || !formData.appointment_date) {
        setSlotData([]);
        return;
      }

      setLoadingSlots(true);
      setSlotError("");

      try {
        const data = await getAvailableSlots(
          doctor.id,
          formData.appointment_date
        );

        setSlotData(data.slot_data || []);

        setFormData((prev) => {
          if (
            prev.appointment_time &&
            !data.available_slots?.includes(prev.appointment_time)
          ) {
            return {
              ...prev,
              appointment_time: "",
            };
          }
          return prev;
        });
      } catch (error) {
        console.log(error);
        setSlotData([]);
        setSlotError(
          error.response?.data?.detail ||
            error.message ||
            "Failed to load available slots. Please try another date."
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctor?.id, formData.appointment_date]);

  // =========================
  // Handle Input Changes
  // =========================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // Handle Booking
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!formData.appointment_time) {
      alert("Please select an available time slot.");
      return;
    }

    try {

      // Updated booking data

      const bookingData = {

        ...formData,

        patient_id: Number(patientId),

        doctor_id: doctor?.id
      };

      console.log(
        "Booking Data:",
        bookingData
      );

      const data =
        await bookAppointment(
          bookingData
        );

      console.log(
        "Booking Response:",
        data
      );

      setResult(data);

      alert(
        "Appointment booked successfully"
      );

    } catch (error) {

      console.log(error);

      console.log(
        error.response?.data
      );

      alert("Booking failed");
    }
  };

  return (

    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg sm:p-8">

        <h1 className="mb-6 text-2xl font-bold text-blue-700 sm:text-3xl">

          Book Appointment

        </h1>

        <h2 className="mb-4 text-lg sm:text-xl">

          {doctor?.name}

        </h2>

        {doctor && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold">Specialization: {doctor.specialization}</p>
            <p className="font-semibold">Qualification: {doctor.qualification || "General"}</p>
            {doctor.hospital_name && (
              <p className="font-semibold">Hospital: {doctor.hospital_name}</p>
            )}
            {doctor.hospital_address && (
              <p className="font-semibold">Address: {doctor.hospital_address}{doctor.hospital_city ? `, ${doctor.hospital_city}` : ""}</p>
            )}
            <p className="font-semibold">Experience: {doctor.experience || 1} years</p>
            <p className="font-semibold">Consultation Fee: ₹{doctor.consultation_fee || "100"}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Appointment Date */}

          <input
            type="date"
            name="appointment_date"
            onChange={handleChange}
            className="w-full border p-3 rounded-lg mb-4"
            required
            min={new Date().toISOString().split("T")[0]}
          />

          {/* Appointment Time */}

          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              Select Time Slot
            </label>

            {loadingSlots ? (
              <p className="text-gray-600">Loading available slots...</p>
            ) : slotError ? (
              <p className="text-red-600">{slotError}</p>
            ) : formData.appointment_date ? (
              slotData.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {slotData.map((slot) => {
                    const isAvailable = slot.status === "available";
                    const isSelected = formData.appointment_time === slot.time;
                    const buttonClass = isAvailable
                      ? isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-blue-50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed";

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          if (!isAvailable) return;
                          setFormData((prev) => ({
                            ...prev,
                            appointment_time: slot.time,
                          }));
                        }}
                        disabled={!isAvailable}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${buttonClass}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{slot.time}</span>
                          {slot.status !== "available" && (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                              {slot.status}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No slots configured for the selected date.</p>
              )
            ) : (
              <p className="text-gray-600">Choose a date to see available slots.</p>
            )}
          </div>

          {/* Symptoms */}

          <textarea
            name="symptoms"
            placeholder="Enter symptoms"
            onChange={handleChange}
            className="mb-4 w-full rounded-lg border p-3"
          />

          {/* Submit Button */}

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 sm:w-auto"
          >

            Confirm Booking

          </button>

        </form>

        {/* Result Section */}

        {result && (

          <div className="mt-8 rounded-xl bg-blue-100 p-6">

            <h2 className="mb-4 text-xl font-bold sm:text-2xl">

              Appointment Requested

            </h2>

            <p className="mb-2">

              Status:
              {" "}

              <span className="font-semibold text-yellow-700">

                {result.status}

              </span>

            </p>

            {/* Confirmed Appointment */}

            {result.status === "confirmed" && (

              <>

                <p>

                  🎫 Token Number:
                  {" "}
                  {result.token_number}

                </p>

                <p>

                  📍 Queue Position:
                  {" "}
                  {result.queue_position}

                </p>

                <p>

                  ⏱ Estimated Wait:
                  {" "}
                  {result.estimated_wait_time}
                  {" "}
                  mins

                </p>

              </>

            )}

            {/* Pending Appointment */}

            {result.status === "pending" && (

              <p className="text-gray-700 mt-2">

                Waiting for doctor approval...

              </p>

            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default BookAppointment;