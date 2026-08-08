import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getDoctors, getDoctorsBySpecialization } from "../services/doctorService";

function Doctors() {

  const navigate = useNavigate();
  const location = useLocation();
  const { specialty } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const searchParam = searchParams.get("search") || "";
  const specializationQueryRaw = searchParams.get("specialization") || "";
  const cityQuery = searchParams.get("city") || "";
  const latQuery = searchParams.get("lat");
  const lonQuery = searchParams.get("lon");
  const lat = latQuery ? Number(latQuery) : undefined;
  const lon = lonQuery ? Number(lonQuery) : undefined;

  const rawSpecialty = specialty ? decodeURIComponent(specialty).replace(/\?.*$/, "") : "";
  const normalizedSpecialty = rawSpecialty.replace(/-/g, " ");
  const sanitizeSpecialization = (value) =>
    (value || "").split("?")[0].trim();
  const specializationQuery = sanitizeSpecialization(specializationQueryRaw);
  const storedLocationCity = typeof window !== "undefined"
    ? (() => {
        const selectedCity = sessionStorage.getItem("selected_city");
        if (selectedCity && selectedCity !== "All Cities") return selectedCity;
        return sessionStorage.getItem("current_city") || "";
      })()
    : "";
  const effectiveCityQuery = cityQuery || storedLocationCity;

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState(
    searchParam || sanitizeSpecialization(normalizedSpecialty || specializationQuery || "")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDoctors = async () => {
      try {
        setLoading(true);
        let data;

        const specializationToUse = specializationQuery
          ? sanitizeSpecialization(specializationQuery)
          : normalizedSpecialty;

        const cityToUse = cityQuery || effectiveCityQuery || undefined;

        if (specializationToUse) {
          data = await getDoctorsBySpecialization(specializationToUse, lat, lon, cityToUse);
        } else {
          data = await getDoctors();
        }

        if (mounted) {
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDoctors();

    return () => {
      mounted = false;
    };
  }, [specializationQuery, cityQuery, lat, lon, normalizedSpecialty, effectiveCityQuery]);

  const filteredDoctors = useMemo(() => {
    const normalizedCity = effectiveCityQuery.trim().toLowerCase();
    const query = search.trim().toLowerCase();

    let items = doctors;

    if (normalizedCity) {
      items = items.filter((doctor) => {
        const hospitalCity = doctor.hospital_city?.toLowerCase() || "";
        const hospitalAddress = doctor.hospital_address?.toLowerCase() || "";
        const hospitalName = doctor.hospital_name?.toLowerCase() || "";
        return (
          hospitalCity === normalizedCity ||
          hospitalAddress.includes(normalizedCity) ||
          hospitalName.includes(normalizedCity)
        );
      });
    }

    if (!query) return items;

    return items.filter((doctor) => {
      const name = doctor.name?.toLowerCase() || "";
      const specialization = doctor.specialization?.toLowerCase() || "";
      return name.includes(query) || specialization.includes(query);
    });
  }, [doctors, search, effectiveCityQuery]);

  const hospitalGroups = useMemo(() => {
    const groups = new Map();

    filteredDoctors.forEach((doctor) => {
      const key = doctor.hospital_id || `${doctor.hospital_name}-${doctor.hospital_address}`;
      if (!groups.has(key)) {
        groups.set(key, {
          hospital_id: doctor.hospital_id,
          hospital_name: doctor.hospital_name || "Unknown Hospital",
          hospital_address: doctor.hospital_address || "Address not available",
          hospital_city: doctor.hospital_city || "",
          doctors: [],
          distance_km: doctor.distance_km ?? null,
        });
      }

      const group = groups.get(key);
      group.doctors.push(doctor);
      if (doctor.distance_km != null && (group.distance_km == null || doctor.distance_km < group.distance_km)) {
        group.distance_km = doctor.distance_km;
      }
    });

    return Array.from(groups.values()).sort((a, b) => (a.doctors.length === b.doctors.length ? 0 : b.doctors.length - a.doctors.length));
  }, [filteredDoctors]);

  const displaySpecialization = sanitizeSpecialization(specializationQuery || normalizedSpecialty);

  if (loading) {
    return (
      <h1 className="mt-10 text-center text-2xl">
        Loading Doctors...
      </h1>
    );
  }

  return (

    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto w-full max-w-7xl">

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-blue-700 sm:text-4xl">
            {displaySpecialization ? `${displaySpecialization} Doctors` : "Doctors"}
          </h1>
          <p className="mt-2 text-gray-600">
            {displaySpecialization
              ? `Showing ${effectiveCityQuery ? `${effectiveCityQuery} specialists` : "doctors"} sorted by lowest wait time and availability.`
              : "Browse doctors and book appointments securely."}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            className="w-full rounded-lg border px-4 py-3 sm:w-[280px]"
          />
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (search.trim()) params.set("search", search.trim());
              if (specializationQuery) params.set("specialization", specializationQuery);
              if (effectiveCityQuery) params.set("city", effectiveCityQuery);
              if (latQuery) params.set("lat", latQuery);
              if (lonQuery) params.set("lon", lonQuery);

              const queryString = params.toString() ? `?${params.toString()}` : "";
              const destination = specialty
                ? `/specialization/${specialty}${queryString}`
                : `/doctors${queryString}`;

              navigate(destination);
            }}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white sm:px-4 sm:py-2"
          >
            Search
          </button>
        </div>
      </div>

      {specialty && hospitalGroups.length > 0 && (
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Hospitals offering {decodeURIComponent(specialty).replace(/-/g, " ")}</h2>
            {effectiveCityQuery ? (
              <p className="text-gray-600 mt-1">Showing hospitals in {effectiveCityQuery} with this specialty.</p>
            ) : (
              <p className="text-gray-600 mt-1">Showing nearby hospitals that offer this specialty.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {hospitalGroups.map((hospital) => (
              <div key={hospital.hospital_name + hospital.hospital_address} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 break-words">{hospital.hospital_name}</h3>
                    <p className="mt-2 break-words text-gray-600">{hospital.hospital_address}</p>
                    {hospital.hospital_city && <p className="mt-1 text-gray-600">City: {hospital.hospital_city}</p>}
                  </div>
                  {hospital.distance_km != null && (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {hospital.distance_km} km
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                    {hospital.doctors.length} doctor{hospital.doctors.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => {
                      if (hospital.hospital_id) {
                        navigate(`/hospital/${hospital.hospital_id}`);
                      }
                    }}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    View Hospital
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

        {filteredDoctors.map((doctor) => (

          <div
            key={doctor.id}
            className="rounded-2xl bg-white p-6 shadow-lg"
          >

            <h2 className="mb-2 break-words text-xl font-semibold">

              {doctor.name}

            </h2>

            <p className="mb-1.5 break-words text-sm text-gray-600">

              🩺 {doctor.specialization}

            </p>

            {doctor.hospital_name && (
              <p className="mb-1.5 break-words text-sm text-gray-600">
                🏥 Works at {doctor.hospital_name}
              </p>
            )}

            {doctor.hospital_address && (
              <p className="mb-1.5 break-words text-sm text-gray-600">
                📍 {doctor.hospital_address}
                {doctor.hospital_city ? `, ${doctor.hospital_city}` : ""}
              </p>
            )}

            <p className="mb-1.5 text-sm text-gray-600">

              🎓 {doctor.qualification}

            </p>

            <p className="mb-1.5 text-sm text-gray-600">
              ⭐ Rating:{" "}
              {doctor.average_rating != null ? (
                <span>
                  {doctor.average_rating.toFixed(1)} / 5
                  {doctor.rating_count ? ` (${doctor.rating_count})` : ""}
                </span>
              ) : (
                <span>No ratings yet</span>
              )}
            </p>

            <p className="mb-1.5 text-sm text-gray-600">

              ⏳ Experience:
              {" "}
              {doctor.experience}
              {" "}
              years

            </p>

            <p className="mb-4 text-sm text-gray-600">

              💰 Consultation Fee:
              {" "}
              ₹{doctor.consultation_fee}

            </p>

            <button
              onClick={() =>
                navigate("/book-appointment", {
                  state: { doctor }
                })
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >

              Book Appointment

            </button>

          </div>

        ))}

      </div>

      </div>
    </div>
  );
}

export default Doctors;