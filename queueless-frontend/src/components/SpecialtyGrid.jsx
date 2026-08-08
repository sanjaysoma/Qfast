import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Baby,
  Bone,
  Heart,
  Sparkles,
  Brain,
  Smile,
  Cpu,
  User2,
  Eye,
  AirVent,
  Headphones,
  Clipboard,
  Droplet,
  Ribbon,
  Activity,
  Thermometer,
  Crosshair,
  Scissors,
  Leaf,
} from "lucide-react";
import SpecialtyCard from "./SpecialtyCard";
import { getSpecializations, getSpecializationsByCity, getSpecializationsNearby } from "../services/doctorService";

const SPECIALTY_DEFINITIONS = [
  { specialization: "General Physician", icon: Stethoscope },
  { specialization: "Dentist", icon: Smile },
  { specialization: "Pediatrics", icon: Baby },
  { specialization: "pediatric surgery", icon: Scissors },
  { specialization: "Orthopedics", icon: Bone },
  { specialization: "Cardiology", icon: Heart },
  { specialization: "Dermatology", icon: Sparkles },
  { specialization: "Psychiatry", icon: Brain },
  { specialization: "Psychology", icon: Smile },
  { specialization: "homoeopathy", icon: Sparkles },
  { specialization: "ayurvedic", icon: Leaf },
  { specialization: "unani", icon: Leaf },
  { specialization: "Neurology", icon: Cpu },
  { specialization: "Gynecology", icon: User2 },
  { specialization: "Ophthalmology", icon: Eye },
  { specialization: "Pulmonology", icon: AirVent },
  { specialization: "ENT", icon: Headphones },
  { specialization: "Gastroenterology", icon: Clipboard },
  { specialization: "Nephrology", icon: Droplet },
  { specialization: "Oncology", icon: Ribbon },
  { specialization: "Physiotherapy", icon: Activity },
  { specialization: "Endocrinology", icon: Thermometer },
  { specialization: "Urology", icon: Crosshair },
  { specialization: "General Surgery", icon: Scissors },
];

function normalizeSpecialization(name) {
  return name?.trim().toLowerCase() || "";
}

function SpecialtyGrid({ currentCity, selectedCity, userLocation }) {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const targetCity = selectedCity && selectedCity !== "All Cities" ? selectedCity : currentCity;

        let data = [];
        if (targetCity) {
          data = await getSpecializationsByCity(targetCity);
        } else if (userLocation?.latitude != null && userLocation?.longitude != null) {
          const nearbyData = await getSpecializationsNearby(userLocation.latitude, userLocation.longitude, 50);
          data = Array.isArray(nearbyData) && nearbyData.length > 0 ? nearbyData : await getSpecializations();
        } else {
          data = await getSpecializations();
        }

        setSpecializations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to load specialties", err);
        setSpecializations([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedCity, currentCity, userLocation?.latitude, userLocation?.longitude]);

  const resolvedSpecialties = useMemo(() => {
    const apiMap = specializations.reduce((acc, item) => {
      if (!item?.specialization) return acc;
      acc[normalizeSpecialization(item.specialization)] = item;
      return acc;
    }, {});

    return SPECIALTY_DEFINITIONS.map((definition) => {
      const normalized = normalizeSpecialization(definition.specialization);
      const apiEntry = apiMap[normalized] || {
        specialization: definition.specialization,
        doctor_count: 0,
        fastest_wait_time: null,
      };

      const assetName = (() => {
        const name = definition.specialization.trim();
        const normalized = name.toLowerCase();

        if (normalized === "general physician") return "General Physician";
        if (normalized === "pediatric surgery") return "pediatric surgery";
        if (normalized === "homoeopathy") return "homoeopathy";
        if (normalized === "ayurvedic") return "ayurvedic";
        if (normalized === "unani") return "unani";
        return name;
      })();

      const asset = assetName
        ? new URL(`../assets/specialties/${assetName}.png`, import.meta.url).href
        : undefined;

      return {
        ...apiEntry,
        icon: definition.icon,
        normalized,
        asset,
      };
    }).sort((a, b) => (b.doctor_count || 0) - (a.doctor_count || 0));
  }, [specializations]);

  const explicitCitySelection = selectedCity && selectedCity !== "All Cities";
  const targetCity = explicitCitySelection ? selectedCity : currentCity;

  return (
    <section id="specializations" className="bg-[#F8FAFC] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 sm:text-sm">Popular Specialties</p>
            <h2 className="mt-2 text-base font-semibold text-slate-900 sm:text-2xl lg:text-3xl">Find doctors by specialty and book appointments.</h2>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl bg-white p-6 text-sm text-red-600 shadow-sm">{error}</div>
        ) : (
          <>
            {/* Mobile compact grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-4 lg:hidden">
              {loading
                ? Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="h-24 rounded-lg bg-slate-100 sm:h-32" />
                  ))
                : resolvedSpecialties.map((item) => {
                    const params = new URLSearchParams();
                    params.set("specialization", item.specialization);

                    if (targetCity) {
                      params.set("city", targetCity);
                    }

                    if (userLocation?.latitude != null && userLocation?.longitude != null) {
                      params.set("lat", String(userLocation.latitude));
                      params.set("lon", String(userLocation.longitude));
                    }

                    const queryString = params.toString() ? `?${params.toString()}` : "";

                    return (
                      <SpecialtyCard
                        key={item.specialization}
                        icon={item.icon}
                        asset={item.asset}
                        specialization={item.specialization}
                        doctorCount={item.doctor_count}
                        fastestWaitTime={item.fastest_wait_time ?? "—"}
                        isMobile={true}
                        onClick={() =>
                          navigate(`/doctors${queryString}`)
                        }
                      />
                    );
                  })}
            </div>

            {/* Desktop full-size grid */}
            <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {loading
                ? Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="h-44 rounded-[16px] bg-slate-100" />
                  ))
                : resolvedSpecialties.map((item) => {
                    const params = new URLSearchParams();
                    params.set("specialization", item.specialization);

                    if (targetCity) {
                      params.set("city", targetCity);
                    }

                    if (userLocation?.latitude != null && userLocation?.longitude != null) {
                      params.set("lat", String(userLocation.latitude));
                      params.set("lon", String(userLocation.longitude));
                    }

                    const queryString = params.toString() ? `?${params.toString()}` : "";

                    return (
                      <SpecialtyCard
                        key={item.specialization}
                        icon={item.icon}
                        asset={item.asset}
                        specialization={item.specialization}
                        doctorCount={item.doctor_count}
                        fastestWaitTime={item.fastest_wait_time ?? "—"}
                        isMobile={false}
                        onClick={() =>
                          navigate(`/doctors${queryString}`)
                        }
                      />
                    );
                  })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default SpecialtyGrid;
