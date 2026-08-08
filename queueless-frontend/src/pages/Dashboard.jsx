import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getHospitals } from "../services/hospitalService";
import { getDoctors } from "../services/doctorService";

function Dashboard() {

  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [hospitalData, doctorData] = await Promise.all([
          getHospitals(),
          getDoctors()
        ]);

        if (!mounted) return;
        setHospitals(hospitalData);
        setDoctors(doctorData);
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <h1 className="mt-10 text-center text-2xl">
        Loading Hospitals...
      </h1>
    );
  }

  return (

    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto w-full max-w-7xl">

      <h1 className="mb-8 text-3xl font-bold text-blue-700 sm:text-4xl">

        Registered Doctors and Hospitals

      </h1>

      <section className="mb-10">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold sm:text-3xl">Hospitals</h2>
            <p className="mt-1 text-gray-600">All registered hospitals available for appointments.</p>
          </div>
          <button
            onClick={() => navigate("/doctors")}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 sm:w-auto"
          >
            View Doctors
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 break-words text-xl font-semibold sm:text-2xl">{hospital.name}</h3>
              <p className="mb-2 break-words text-gray-600">📍 {hospital.address}</p>
              <p className="mb-2 break-words text-gray-600">📞 {hospital.phone || "N/A"}</p>
              <p className="break-words text-gray-600">⏱ Avg consultation: {hospital.average_consultation_time} mins</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold sm:text-3xl">Doctors</h2>
            <p className="mt-1 text-gray-600">Doctors available for booking across all hospitals.</p>
          </div>
          <button
            onClick={() => navigate("/doctors")}
            className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 sm:w-auto"
          >
            Browse Doctors
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 break-words text-xl font-semibold sm:text-2xl">{doctor.name}</h3>
              <p className="mb-2 break-words text-gray-600">🩺 {doctor.specialization}</p>
              {doctor.hospital_name && (
                <p className="mb-2 break-words text-gray-600">🏥 {doctor.hospital_name}</p>
              )}
              <p className="mb-2 break-words text-gray-600">🎓 {doctor.qualification || "General"}</p>
              <p className="mb-2 break-words text-gray-600">💰 Fee: ₹{doctor.consultation_fee ?? "N/A"}</p>
              <button
                onClick={() => navigate("/book-appointment", { state: { doctor } })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </section>

      </div>

    </div>
  );
}

export default Dashboard;