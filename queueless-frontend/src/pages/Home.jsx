import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentLocation, getCityFromCoordinates } from "../services/locationService";
import SpecialtyGrid from "../components/SpecialtyGrid";
import { getHospitalsByCity, getNearbyHospitals } from "../services/hospitalService";
import Logo from "../assets/icon.png";
import HeroBg from "../assets/hero.png";
import DISTRICTS from "../data/indiaDistricts";

const CITY_OPTIONS = DISTRICTS;


function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(() => sessionStorage.getItem("selected_city") || "All Cities");
  const [currentCity, setCurrentCity] = useState(() => sessionStorage.getItem("current_city") || "");
  const [userLocation, setUserLocation] = useState(null);
  const [cityHospitals, setCityHospitals] = useState([]);
  const [loadingCityHospitals, setLoadingCityHospitals] = useState(false);
  const [hospitalSource, setHospitalSource] = useState("city");
  const loading = false;

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation({
          minAccuracy: 5000,
          watchTimeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 10000,
          allowIpFallback: true,
        });
        setUserLocation(location);

        if (location.latitude != null && location.longitude != null) {
          sessionStorage.setItem("detected_latitude", String(location.latitude));
          sessionStorage.setItem("detected_longitude", String(location.longitude));
          sessionStorage.setItem("detected_source", String(location.source || "unknown"));
        }

        if (location.latitude != null && location.longitude != null) {
          const hasGoodAccuracy =
            location.accuracy == null ||
            !Number.isFinite(Number(location.accuracy)) ||
            Number(location.accuracy) <= 3000;
          const cityName = await getCityFromCoordinates(location.latitude, location.longitude, {
            preferArea: hasGoodAccuracy,
          });
          if (cityName) {
            setCurrentCity(cityName);
            sessionStorage.setItem("current_city", cityName);

            const storedSelectedCity = sessionStorage.getItem("selected_city");
            const shouldUseDetectedCity = !storedSelectedCity || storedSelectedCity === "All Cities";

            if (
              shouldUseDetectedCity &&
              CITY_OPTIONS.some((city) => city.toLowerCase() === cityName.toLowerCase())
            ) {
              setSelectedCity(cityName);
              sessionStorage.setItem("selected_city", cityName);
              window.dispatchEvent(new Event("cityChanged"));
            }
          }
        }
      } catch (error) {
        console.warn("Location detection failed", error);
      }
    };

    fetchLocation();

    // Expose a manual detect function in the UI via a custom event
    const onDetect = async () => {
      try {
        const location = await getCurrentLocation({
          minAccuracy: 5000,
          watchTimeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 10000,
          allowIpFallback: true,
        });
        setUserLocation(location);
        if (location.latitude != null && location.longitude != null) {
          sessionStorage.setItem("detected_latitude", String(location.latitude));
          sessionStorage.setItem("detected_longitude", String(location.longitude));
          sessionStorage.setItem("detected_source", String(location.source || "unknown"));
        }
        if (location.latitude != null && location.longitude != null) {
          const hasGoodAccuracy =
            location.accuracy == null ||
            !Number.isFinite(Number(location.accuracy)) ||
            Number(location.accuracy) <= 3000;
          const cityName = await getCityFromCoordinates(location.latitude, location.longitude, {
            preferArea: hasGoodAccuracy,
          });
          if (cityName) {
            setCurrentCity(cityName);
            sessionStorage.setItem("current_city", cityName);
            window.dispatchEvent(new Event("cityChanged"));
          }
        }
      } catch (err) {
        console.warn("Manual location detection failed", err);
        alert("Location detection failed. Make sure location permissions are enabled.");
      }
    };

    window.addEventListener("manualDetectLocation", onDetect);
    const onCityChanged = () => {
      const sc = sessionStorage.getItem("selected_city") || sessionStorage.getItem("current_city") || "All Cities";
      setSelectedCity(sc);
    };

    window.addEventListener("cityChanged", onCityChanged);

    return () => {
      window.removeEventListener("cityChanged", onCityChanged);
      window.removeEventListener("manualDetectLocation", onDetect);
    };
  }, []);

  useEffect(() => {
    const explicitCitySelection = selectedCity && selectedCity !== "All Cities";
    const cityToUse = explicitCitySelection ? selectedCity : currentCity;

    let mounted = true;
    (async () => {
      if (!cityToUse && (userLocation?.latitude == null || userLocation?.longitude == null)) {
        if (mounted) {
          setCityHospitals([]);
          setHospitalSource("city");
          setLoadingCityHospitals(false);
        }
        return;
      }

      setLoadingCityHospitals(true);
      try {
        let data = [];

        if (cityToUse) {
          data = await getHospitalsByCity(cityToUse);
        }

        if (mounted) {
          if ((!Array.isArray(data) || data.length === 0) && !explicitCitySelection && userLocation?.latitude != null && userLocation?.longitude != null) {
            data = await getNearbyHospitals(userLocation.latitude, userLocation.longitude);
            setHospitalSource("nearby");
          } else {
            setHospitalSource("city");
          }
        }

        if (mounted) {
          setCityHospitals(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load hospitals by city", err);
        if (mounted) {
          setCityHospitals([]);
          setHospitalSource("city");
        }
      } finally {
        if (mounted) {
          setLoadingCityHospitals(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedCity, currentCity, userLocation?.latitude, userLocation?.longitude]);

  // query normalization removed — not needed in this view

  // filteredDoctors, filteredHospitals, and related helper values removed
  // because this view no longer shows the Popular Doctors / Top Rated Hospitals sections.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl">Loading content...</h2>
      </div>
    );
  }

  const cityForHospitals = selectedCity !== "All Cities" ? selectedCity : currentCity;
  const doctorsLinkDestination = cityForHospitals
    ? `/doctors?city=${encodeURIComponent(cityForHospitals)}`
    : "/doctors";
  const hospitalsLinkDestination = cityForHospitals
    ? `/hospitals?city=${encodeURIComponent(cityForHospitals)}`
    : "/hospitals";

  return (
    <div className="min-h-screen bg-white">
      <header className="relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-2xl sm:mx-6 sm:mt-6">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HeroBg})` }} />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-center lg:justify-start">
                <img src={Logo} alt="QFast logo" className="h-28 w-auto max-w-[10rem] sm:h-28 sm:max-w-[9.5rem] lg:h-32 lg:max-w-[10.5rem]" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    QFast
                  </h1>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-20 rounded-[32px] border border-white/10 bg-white px-3 py-2 shadow-[0_16px_32px_rgba(8,102,255,0.18)] sm:px-3 sm:py-2 lg:rounded-[40px] lg:py-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 shadow-inner shadow-slate-200/10">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search doctors or hospitals..."
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => { if (query.trim()) navigate(`/hospitals?search=${encodeURIComponent(query)}`); }}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#0b63ff] px-5 text-sm font-semibold text-white shadow-lg shadow-[#0b63ff]/30 transition hover:bg-[#0958e0] sm:w-auto"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden">
          <svg className="absolute inset-x-0 bottom-0 h-[180px] w-full" viewBox="0 0 1440 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-grad-a" x1="0" x2="1">
                <stop offset="0%" stopColor="#0b63ff" />
                <stop offset="100%" stopColor="#0373ff" />
              </linearGradient>
              <linearGradient id="wave-grad-b" x1="0" x2="1">
                <stop offset="0%" stopColor="#06307a" />
                <stop offset="100%" stopColor="#0753d1" />
              </linearGradient>
            </defs>
            <path d="M0,120 C300,60 600,90 900,100 C1200,110 1320,90 1440,80 L1440,180 L0,180 Z" fill="url(#wave-grad-a)" opacity="0.95" />
            <path d="M0,130 C300,80 600,100 900,110 C1200,120 1320,100 1440,90 L1440,180 L0,180 Z" fill="url(#wave-grad-b)" opacity="0.7" />
          </svg>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SpecialtyGrid
          currentCity={currentCity}
          selectedCity={selectedCity}
          userLocation={userLocation}
        />

        <section className="mt-12">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900 sm:text-xl lg:text-2xl">
              {hospitalSource === "nearby"
                ? "Nearby hospitals"
                : `Hospitals in ${selectedCity !== "All Cities" ? selectedCity : (currentCity || "your city")}`}
            </h2>
            <button
              onClick={() => {
                if (cityForHospitals) {
                  navigate(`/hospitals?city=${encodeURIComponent(cityForHospitals)}`);
                } else {
                  navigate("/hospitals");
                }
              }}
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 sm:w-auto"
            >
              View all
            </button>
          </div>

          {loadingCityHospitals ? (
            <p className="text-slate-600">Loading hospitals...</p>
          ) : cityHospitals.length === 0 ? (
            <p className="text-slate-600">No hospitals found for the selected location.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {cityHospitals.slice(0, 6).map((hospital) => (
                <div key={hospital.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
                  <h3 className="break-words text-sm font-semibold text-slate-900 sm:text-lg">{hospital.name}</h3>
                  <p className="mt-1 break-words text-xs text-slate-600 sm:text-sm">{hospital.address || hospital.city}</p>
                  <button
                    onClick={() => navigate(`/hospital/${hospital.id}`)}
                    className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-blue-600 hover:underline sm:mt-4 sm:min-h-11 sm:text-sm"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-[#020b2f] py-14 text-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <img src={Logo} alt="QFast Logo" className="h-12 w-12 shrink-0" />
              <h4 className="text-xl font-semibold text-white">QFast</h4>
            </div>
            <p className="mt-2 text-sm">Your Time. Our Priority.</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-white sm:text-base">Quick Links</h4>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                <li><Link to="/" className="text-gray-300">Home</Link></li>
                <li><Link to={doctorsLinkDestination} className="text-gray-300">Doctors</Link></li>
                <li><Link to={hospitalsLinkDestination} className="text-gray-300">Hospitals</Link></li>
                <li><Link to="/#specializations" className="text-gray-300">Specializations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white sm:text-base">Support</h4>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                <li><Link to="/faq" className="text-gray-300">About Us and FAQs</Link></li>
                <li><Link to="/privacy" className="text-gray-300">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-300">Terms & Conditions</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white sm:text-base">Contact</h4>
              <p className="mt-2 text-xs sm:text-sm">Follow us on social media</p>
              <a
                href="https://www.instagram.com/QFast___01/"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20 sm:text-sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 text-pink-400"
                  aria-hidden="true"
                >
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5z" />
                  <path d="M12 7.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5zm0 1.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5z" />
                  <path d="M17.75 6.208a.792.792 0 1 1 0 1.584.792.792 0 0 1 0-1.584z" />
                </svg>
                Instagram
              </a>
              <p className="mt-2 text-[11px] sm:text-xs">© 2026 QFast. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;


