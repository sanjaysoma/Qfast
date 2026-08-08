import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function MyAreaDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const patientId = sessionStorage.getItem("patient_id");
        if (!patientId) {
          setError("Patient not logged in");
          setLoading(false);
          return;
        }

        const resp = await API.get(`/area/doctors/my-area/${patientId}`);
        setDoctors(resp.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load doctors for your area.");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-4 text-3xl font-bold text-blue-700">Doctors in Your Area</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : doctors.length === 0 ? (
          <p>No doctors found in your district.</p>
        ) : (
          <div className="grid gap-4">
            {doctors.map((d) => (
              <div key={d.doctor_id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="break-words text-xl font-semibold">{d.doctor_name}</h2>
                    <p className="break-words text-sm text-gray-600">{d.specialization} — {d.hospital_name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">{d.queue_count} in queue</p>
                    <p className="text-sm text-gray-600">Est wait: {d.estimated_wait_time} mins</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/book-appointment', { state: { doctor: { id: d.doctor_id, name: d.doctor_name } } })}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-white sm:py-2"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAreaDoctors;
