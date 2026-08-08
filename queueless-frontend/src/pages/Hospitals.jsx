import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getHospitals, getHospitalsByCity } from "../services/hospitalService";

function Hospitals() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParam = new URLSearchParams(location.search).get("search") || "";
  const cityParam = new URLSearchParams(location.search).get("city") || "";

  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState(() => searchParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadHospitals = async () => {
      try {
        setLoading(true);
        const normalizedCity = cityParam.trim();
        const data = normalizedCity
          ? await getHospitalsByCity(normalizedCity)
          : await getHospitals();

        if (mounted) {
          setHospitals(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHospitals();

    return () => {
      mounted = false;
    };
  }, [cityParam]);

  const filteredHospitals = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedCity = cityParam.trim().toLowerCase();

    let items = hospitals;

    // Filter by city if provided
    if (normalizedCity) {
      items = items.filter((hospital) => {
        const hospitalCity = hospital.city?.toLowerCase() || "";
        const hospitalAddress = hospital.address?.toLowerCase() || "";
        return hospitalCity === normalizedCity || hospitalAddress.includes(normalizedCity);
      });
    }

    // Filter by search query
    if (!query) return items;

    return items.filter((hospital) => {
      const name = hospital.name?.toLowerCase() || "";
      const address = hospital.address?.toLowerCase() || "";
      return name.includes(query) || address.includes(query);
    });
  }, [hospitals, search, cityParam]);

  if (loading) {
    return <h1 className="mt-10 text-center text-2xl">Loading Hospitals...</h1>;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-blue-700 sm:text-4xl">
            Find the Best Hospitals{cityParam ? ` in ${cityParam}` : ""}
          </h1>
          <p className="mt-1 text-gray-600">Get quality treatment from trusted facilities near you.</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:max-w-md md:flex-row md:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals..."
            className="w-full rounded-lg border px-4 py-3 md:py-2"
          />
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set("search", search);
              if (cityParam) params.set("city", cityParam);
              navigate(`/hospitals?${params.toString()}`);
            }}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white md:py-2"
          >
            Search
          </button>
        </div>
      </div>

      {filteredHospitals.length === 0 ? (
        <p className="text-center text-gray-600">
          {cityParam && search
            ? `No hospitals found in "${cityParam}" matching "${search}".`
            : cityParam
            ? `No hospitals found in "${cityParam}".`
            : search
            ? `No hospitals found matching "${search}".`
            : "No hospitals found."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-2 text-xl font-semibold break-words sm:text-2xl">{hospital.name}</h2>
                <p className="mb-4 break-words text-gray-600">{hospital.address}</p>
              {hospital.google_maps_link || (hospital.latitude && hospital.longitude) ? (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      let link = hospital.google_maps_link
                        ? hospital.google_maps_link
                        : `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`;
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
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" />
                      <circle cx="12" cy="10" r="2" strokeWidth="2" />
                    </svg>
                    View on Map
                  </button>
                </div>
              ) : null}
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">Emergency</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">OPD</span>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">ICU</span>
              </div>
              <button
                onClick={() => navigate(`/hospital/${hospital.id}`)}
                className="inline-flex min-h-11 items-center text-blue-600 underline"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default Hospitals;
