import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHospitalById } from "../services/hospitalService";
import { getDoctorsByHospital } from "../services/doctorService";

function HospitalDetails() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hospitalData, doctorData] = await Promise.all([
          getHospitalById(hospitalId),
          getDoctorsByHospital(hospitalId)
        ]);
        setHospital(hospitalData);
        setDoctors(Array.isArray(doctorData) ? doctorData : []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  if (loading) {
    return <h1 className="mt-10 text-center text-2xl">Loading Hospital...</h1>;
  }

  if (!hospital) {
    return <h1 className="mt-10 text-center text-2xl">Hospital not found.</h1>;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex min-h-11 items-center font-semibold text-blue-600">
          ← Back
        </button>

        {/* Hospital Information */}
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <h1 className="mb-4 break-words text-3xl font-bold text-blue-700 sm:text-4xl">{hospital.name}</h1>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="break-words text-lg text-gray-600">{hospital.address || "Address not provided"}</p>
            {/** Maps button: open provided Google Maps link or fall back to lat/lon */}
            {hospital.google_maps_link || (hospital.latitude && hospital.longitude) ? (
              <button
                onClick={() => {
                  let link = hospital.google_maps_link
                    ? hospital.google_maps_link
                    : `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`;
                  // Ensure absolute URL and encode unsafe characters
                  try {
                    new URL(link);
                  } catch {
                    link = `https://${link.replace(/^\/*/, "")}`;
                  }
                  link = encodeURI(link);
                  const a = document.createElement('a');
                  a.href = link;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                title="Open in Google Maps"
                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 hover:bg-slate-200 sm:ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" />
                  <circle cx="12" cy="10" r="2" strokeWidth="2" />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 font-semibold">Emergency</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 font-semibold">OPD</span>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700 font-semibold">ICU</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
            <div>
              <p className="text-gray-600 text-sm">Phone</p>
              <p className="font-semibold text-gray-900">{hospital.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="font-semibold text-gray-900">{hospital.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">City</p>
              <p className="font-semibold text-gray-900">{hospital.city || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">State</p>
              <p className="font-semibold text-gray-900">{hospital.state || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Doctors Section */}
        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-blue-700 sm:text-3xl">Doctors at {hospital.name}</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No doctors currently available at this hospital.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <div key={doctor.id || doctor._id} className="rounded-2xl border p-6 transition hover:shadow-lg">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                      {doctor.name?.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <h3 className="break-words text-lg font-semibold text-gray-900">{doctor.name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold text-gray-900">Qualification:</span>{" "}
                      <span>{doctor.qualification || "N/A"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Experience:</span>{" "}
                      <span>{doctor.experience || "N/A"} years</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Consultation Fee:</span>{" "}
                      <span>₹{doctor.consultation_fee || "N/A"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Rating:</span>{" "}
                      {doctor.average_rating != null ? (
                        <span>
                          {doctor.average_rating.toFixed(1)} / 5
                          {doctor.rating_count ? ` (${doctor.rating_count} review${doctor.rating_count === 1 ? "" : "s"})` : ""}
                        </span>
                      ) : (
                        <span>No ratings yet</span>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Estimated Wait:</span>{" "}
                      <span>{doctor.estimated_wait_time != null ? `${doctor.estimated_wait_time} mins` : "N/A"}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/book-appointment", { state: { doctor } })}
                    className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 sm:py-2"
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HospitalDetails;
