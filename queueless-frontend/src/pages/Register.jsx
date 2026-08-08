import { useState, useEffect, useMemo } from "react";
import API from "../api/axios";
import { getHospitalsByDistrict } from "../services/hospitalService";
import { INDIA_STATES, INDIA_STATE_DISTRICTS } from "../data/indiaStateDistricts";

const SPECIALIZATIONS = [
    "General Physician",
    "Dentist",
    "Pediatrics",
    "pediatric surgery",
    "Orthopedics",
    "Cardiology",
    "Dermatology",
    "Psychiatry",
    "Psychology",
    "homoeopathy",
    "ayurvedic",
    "unani",
    "Neurology",
    "Gynecology",
    "Ophthalmology",
    "Pulmonology",
    "ENT",
    "Gastroenterology",
    "Nephrology",
    "Oncology",
    "Physiotherapy",
    "Endocrinology",
    "Urology",
    "General Surgery",
];

function Register() {

    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [role, setRole] = useState("patient");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [qualification, setQualification] = useState("");
    const [medicalCouncilRegistrationNumber, setMedicalCouncilRegistrationNumber] = useState("");
    const [experience, setExperience] = useState(1);
    const [consultationFee, setConsultationFee] = useState(100);
    const [availableFrom, setAvailableFrom] = useState("");
    const [availableTo, setAvailableTo] = useState("");
    const [lunchBreakStart, setLunchBreakStart] = useState("");
    const [lunchBreakEnd, setLunchBreakEnd] = useState("");
    const [hospitals, setHospitals] = useState([]);
    const [hospitalId, setHospitalId] = useState("");
    const [doctorState, setDoctorState] = useState("");
    const [doctorDistrict, setDoctorDistrict] = useState("");
    const [registerLoading, setRegisterLoading] = useState(false);

    const patientDistrictOptions = useMemo(
        () => (state ? Array.from(new Set(INDIA_STATE_DISTRICTS[state] || [])) : []),
        [state]
    );
    const doctorDistrictOptions = useMemo(
        () => (doctorState ? Array.from(new Set(INDIA_STATE_DISTRICTS[doctorState] || [])) : []),
        [doctorState]
    );
    const normalizedMobile = useMemo(() => mobile.replace(/\D/g, "").slice(0, 10), [mobile]);

    useEffect(() => {
        const normalizedDistrict = doctorDistrict.trim();
        if (role !== "doctor" || !normalizedDistrict) {
            return;
        }

        let mounted = true;
        (async () => {
            try {
                const data = await getHospitalsByDistrict(normalizedDistrict);
                if (mounted) setHospitals(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load hospitals", e);
                if (mounted) setHospitals([]);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [role, doctorDistrict]);

    const handleRegister = async () => {
        if (!name.trim()) {
            alert("Enter your name");
            return;
        }

        if (normalizedMobile.length !== 10) {
            alert("Enter valid mobile number");
            return;
        }

        if (role === "doctor" && !specialization.trim()) {
            alert("Please enter your specialization");
            return;
        }

        if (role === "doctor" && !doctorState) {
            alert("Please select your state");
            return;
        }

        if (role === "doctor" && !doctorDistrict) {
            alert("Please select your district");
            return;
        }

        if (role === "doctor" && !hospitalId) {
            alert("Please select your hospital");
            return;
        }

        if (role === "doctor" && !qualification.trim()) {
            alert("Please enter your qualification");
            return;
        }

        if (role === "doctor" && !medicalCouncilRegistrationNumber.trim()) {
            alert("Please enter your Medical Council registration number");
            return;
        }

        if (role === "patient") {
            if (!age || Number(age) <= 0) {
                alert("Please enter a valid age");
                return;
            }
            if (!gender) {
                alert("Please select a gender");
                return;
            }
            if (!state) {
                alert("Please select your state");
                return;
            }
            if (!district) {
                alert("Please select your district");
                return;
            }
        }

        try {
            setRegisterLoading(true);
            const payload = {
                name,
                mobile: normalizedMobile,
                role,
                age: role === "patient" ? Number(age) : undefined,
                gender: role === "patient" ? gender : undefined,
                state: role === "patient" ? state : (role === "doctor" ? doctorState : undefined),
                district: role === "patient" ? district : (role === "doctor" ? doctorDistrict : undefined),
                hospital_id: role === "doctor" ? Number(hospitalId) : undefined,
                specialization: role === "doctor" ? specialization : undefined,
                qualification: role === "doctor" ? qualification : undefined,
                medical_council_registration_number: role === "doctor"
                    ? medicalCouncilRegistrationNumber.trim()
                    : undefined,
                experience: role === "doctor" ? Number(experience) : undefined,
                consultation_fee: role === "doctor" ? Number(consultationFee) : undefined,
                available_from: role === "doctor" ? availableFrom || undefined : undefined,
                available_to: role === "doctor" ? availableTo || undefined : undefined,
                lunch_break_start: role === "doctor" ? lunchBreakStart || undefined : undefined,
                lunch_break_end: role === "doctor" ? lunchBreakEnd || undefined : undefined,
            };

            const response = await API.post(
                "/auth/register",
                payload
            );

            alert(response.data.message);
            window.location.href = "/login";
        } catch (error) {
            alert(
                error.response?.data?.detail ||
                "Registration Failed"
            );
        } finally {
            setRegisterLoading(false);
        }
    };

    const canRegister = !registerLoading;

    return (

        <div className="min-h-screen bg-gray-100 px-4 py-6 lg:px-8">

            <div className="mx-auto w-full max-w-6xl rounded-xl bg-white p-6 shadow-lg sm:p-8">

                <button
                    onClick={() => window.location.href = "/"}
                    className="mb-4 inline-flex min-h-11 items-center text-blue-500"
                >
                    ← Back to home
                </button>

                <h1 className="text-3xl font-bold">
                    <span className="text-blue-500">QFast</span>{" "}Register
                </h1>

                <p className="text-gray-500 mt-2">
                    Create your account
                </p>

                {/* Name */}

                <div className="mt-6 grid gap-4 lg:grid-cols-2">

                    <div>
                        <label className="block mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Mobile Number</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Enter 10-digit mobile"
                            value={mobile}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setMobile(value);
                            }}
                            className="w-full border p-3 rounded-lg"
                        />
                    </div>
                </div>

                {/* Role Selection */}

                <div className="mt-4 lg:col-span-2">

                    <p className="mb-2 font-medium">
                        Register as
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">

                        <button
                            onClick={() => {
                                setRole("patient");
                                setHospitals([]);
                                setHospitalId("");
                            }}
                            className={`flex-1 rounded-lg border py-3 sm:py-2 ${
                                role === "patient"
                                    ? "bg-blue-500 text-white"
                                    : ""
                            }`}
                        >
                            Patient
                        </button>

                        <button
                            onClick={() => {
                                setRole("doctor");
                                setHospitals([]);
                                setHospitalId("");
                            }}
                            className={`flex-1 rounded-lg border py-3 sm:py-2 ${
                                role === "doctor"
                                    ? "bg-blue-500 text-white"
                                    : ""
                            }`}
                        >
                            Doctor
                        </button>

                    </div>

                </div>

                {role === "patient" && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900">Patient Details</h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className="block mb-2">Age</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter your age"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border p-3 rounded-lg bg-white"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2">State</label>
                                <select
                                    value={state}
                                    onChange={(e) => {
                                        setState(e.target.value);
                                        setDistrict("");
                                    }}
                                    className="w-full border p-3 rounded-lg bg-white"
                                >
                                    <option value="">Select your state</option>
                                    {INDIA_STATES.map((stateName) => (
                                        <option key={stateName} value={stateName}>
                                            {stateName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2">District</label>
                                <select
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    className="w-full border p-3 rounded-lg bg-white"
                                    disabled={!state}
                                >
                                    <option value="">
                                        {state ? "Select your district" : "Select state first"}
                                    </option>
                                    {patientDistrictOptions.map((districtName) => (
                                        <option key={districtName} value={districtName}>
                                            {districtName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {role === "doctor" && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900">Doctor Details</h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className="block mb-2">State</label>
                                <select
                                    value={doctorState}
                                    onChange={(e) => {
                                        setDoctorState(e.target.value);
                                        setDoctorDistrict("");
                                        setHospitals([]);
                                        setHospitalId("");
                                    }}
                                    className="w-full border p-3 rounded-lg bg-white"
                                >
                                    <option value="">Select state</option>
                                    {INDIA_STATES.map((stateName) => (
                                        <option key={stateName} value={stateName}>
                                            {stateName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2">District</label>
                                <select
                                    value={doctorDistrict}
                                    onChange={(e) => {
                                        setDoctorDistrict(e.target.value);
                                        setHospitals([]);
                                        setHospitalId("");
                                    }}
                                    className="w-full border p-3 rounded-lg bg-white"
                                    disabled={!doctorState}
                                >
                                    <option value="">
                                        {doctorState ? "Select district" : "Select state first"}
                                    </option>
                                    {doctorDistrictOptions.map((districtName) => (
                                        <option key={districtName} value={districtName}>
                                            {districtName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:col-span-2">
                                <label className="block mb-2">Hospital</label>
                                <select
                                    value={hospitalId}
                                    onChange={(e) => setHospitalId(e.target.value)}
                                    className="w-full border p-3 rounded-lg bg-white"
                                    disabled={!doctorDistrict.trim()}
                                >
                                    <option value="">
                                        {doctorDistrict.trim() ? "Select hospital" : "Select district first"}
                                    </option>
                                    {hospitals.map((h) => (
                                        <option key={h.id || h._id} value={h.id || h._id}>
                                            {h.name}{h.city ? " - " + h.city : ""}
                                        </option>
                                    ))}
                                </select>
                                {doctorDistrict.trim() && hospitals.length === 0 && (
                                    <p className="mt-1 text-sm text-slate-600">
                                        No hospitals found in this district.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2">Specialization</label>
                                <select
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    className="w-full border p-3 rounded-lg bg-white"
                                >
                                    <option value="">Select specialization</option>
                                    {SPECIALIZATIONS.map((spec) => (
                                        <option key={spec} value={spec}>
                                            {spec}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2">Qualification</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MBBS, MD"
                                    value={qualification}
                                    onChange={(e) => setQualification(e.target.value)}
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <label className="block mb-2">
                                    Medical Council Registration Number <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter registration number"
                                    value={medicalCouncilRegistrationNumber}
                                    onChange={(e) => setMedicalCouncilRegistrationNumber(e.target.value)}
                                    className="w-full border p-3 rounded-lg"
                                    required
                                />
                            </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block mb-2">Experience (years)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={experience}
                                        onChange={(e) => setExperience(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Consultation Fee</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={consultationFee}
                                        onChange={(e) => setConsultationFee(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block mb-2">Available From</label>
                                    <input
                                        type="time"
                                        value={availableFrom}
                                        onChange={(e) => setAvailableFrom(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Available To</label>
                                    <input
                                        type="time"
                                        value={availableTo}
                                        onChange={(e) => setAvailableTo(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block mb-2">Lunch Break Start</label>
                                    <input
                                        type="time"
                                        value={lunchBreakStart}
                                        onChange={(e) => setLunchBreakStart(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2">Lunch Break End</label>
                                    <input
                                        type="time"
                                        value={lunchBreakEnd}
                                        onChange={(e) => setLunchBreakEnd(e.target.value)}
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Register Button */}

                <button
                    onClick={handleRegister}
                    disabled={!canRegister}
                    className="mt-6 w-full rounded-lg bg-blue-500 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {registerLoading ? "Registering..." : "Register"}
                </button>

                {/* Login Link */}

                <p className="text-center mt-6">

                    Already have an account?

                    <span
                        onClick={() => window.location.href = "/login"}
                        className="text-blue-500 cursor-pointer ml-1"
                    >
                        Login
                    </span>

                </p>

            </div>

        </div>
    );
}

export default Register;