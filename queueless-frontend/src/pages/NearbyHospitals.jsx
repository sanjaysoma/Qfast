import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentLocation } from "../services/locationService";
import { getNearbyHospitals } from "../services/hospitalService";

function NearbyHospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  

  useEffect(() => {
    let mounted = true;

    const fetchNearby = async () => {
      setLoading(true);
      setError("");

      try {
        const location = await getCurrentLocation({
          minAccuracy: 5000,
          watchTimeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 10000,
          allowIpFallback: true,
        });

        const resolvedLat =
          location.latitude != null
            ? location.latitude
            : Number(sessionStorage.getItem("detected_latitude"));
        const resolvedLon =
          location.longitude != null
            ? location.longitude
            : Number(sessionStorage.getItem("detected_longitude"));

        if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLon)) {
          throw new Error("Location not available");
        }

        sessionStorage.setItem("detected_latitude", String(resolvedLat));
        sessionStorage.setItem("detected_longitude", String(resolvedLon));
        sessionStorage.setItem("detected_source", String(location.source || "cached"));

        const data = await getNearbyHospitals(resolvedLat, resolvedLon);
        if (mounted) {
          setHospitals(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!mounted) return;
        if (err.code === 1 || err.code === 2 || err.code === 3) {
          setPermissionDenied(true);
          setError("Location permission denied or unavailable.");
        } else {
          setError(err.message || "Unable to get location.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchNearby();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 pb-24 pt-4 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-4 text-3xl font-bold text-blue-700 sm:text-4xl">Nearby Hospitals</h1>
        <p className="mb-6 text-gray-600">
          Use GPS to discover hospitals close to you.
        </p>

        {permissionDenied && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
            <p className="font-semibold">Location access is denied.</p>
          </div>
        )}

        {error && <p className="mb-4 text-red-600">{error}</p>}

        {/* Removed display of current/detected coordinates per request */}

        {loading ? (
          <p className="text-gray-600">Loading hospitals…</p>
        ) : hospitals.length === 0 ? (
          <p className="text-gray-600">No nearby hospitals found for your detected location.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hospitals.map((hospital) => (
              <div key={hospital.hospital_id || hospital.id} className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="break-words text-2xl font-semibold text-gray-900">{hospital.name}</h2>
                    <p className="break-words text-sm text-gray-500">{hospital.address}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {hospital.distance_km != null ? `${hospital.distance_km} km` : hospital.city || "City"}
                  </span>
                </div>
                <p className="mb-4 break-words text-gray-600">{hospital.city ? `City: ${hospital.city}` : ""}</p>
                {hospital.latitude != null && hospital.longitude != null && (
                  <p className="break-words text-xs text-gray-500">Coordinates: {hospital.latitude.toFixed(6)}, {hospital.longitude.toFixed(6)}</p>
                )}
                <button
                  onClick={() => navigate(`/hospital/${hospital.hospital_id || hospital.id}`)}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
                >
                  View Doctors
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NearbyHospitals;
