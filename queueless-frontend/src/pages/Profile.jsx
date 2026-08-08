import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorById, updateDoctor } from "../services/doctorService";
import { updatePatient } from "../services/patientService";

function Profile() {
  const navigate = useNavigate();
  const currentRole = sessionStorage.getItem("current_role") || "patient";
  const doctorId = sessionStorage.getItem("doctor_id");
  const patientId = sessionStorage.getItem("patient_id");

  const [profile, setProfile] = useState({
    name: "",
    mobile: "",
    role: currentRole,
    gender: "",
    age: "",
    state: "",
    district: "",
    address: "",
    specialization: "",
    qualification: "",
    experience: "",
    email: "",
    consultation_fee: "",
    hospital_name: "",
    hospital_address: "",
    hospital_city: "",
    available_from: "",
    available_to: "",
    lunch_break_start: "",
    lunch_break_end: "",
    average_consultation_time: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let updated;
      if (currentRole === "doctor" && doctorId) {
        const payload = {
          name: profile.name,
          specialization: profile.specialization,
          qualification: profile.qualification,
          experience: profile.experience ? Number(profile.experience) : undefined,
          phone: profile.mobile || undefined,
          email: profile.email,
          consultation_fee: profile.consultation_fee ? Number(profile.consultation_fee) : undefined,
          available_from: profile.available_from || undefined,
          available_to: profile.available_to || undefined,
          lunch_break_start: profile.lunch_break_start || undefined,
          lunch_break_end: profile.lunch_break_end || undefined,
          state: profile.state || undefined,
          city: profile.hospital_city || undefined,
          hospital_name: profile.hospital_name || undefined,
          address: profile.hospital_address || undefined,
        };
        updated = await updateDoctor(doctorId, payload);
      } else if (currentRole === "patient" && patientId) {
        const payload = {
          name: profile.name,
          age: profile.age ? Number(profile.age) : undefined,
          gender: profile.gender || undefined,
          state: profile.state || undefined,
          district: profile.district || undefined,
          address: profile.address || undefined,
        };
        updated = await updatePatient(patientId, payload);
      }

      if (updated) {
        setProfile((current) => ({
          ...current,
          ...updated,
        }));
        sessionStorage.setItem("profile_data", JSON.stringify({
          ...profile,
          ...updated,
        }));
        setIsEditMode(false);
        alert("Profile updated successfully.");
      }
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = sessionStorage.getItem("profile_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile((current) => ({
            ...current,
            ...parsed,
            role: parsed.role || currentRole,
          }));
        } else {
          setProfile((current) => ({
            ...current,
            name: sessionStorage.getItem("name") || "",
            mobile: sessionStorage.getItem("mobile") || "",
            role: currentRole,
          }));
        }

        if (currentRole === "doctor" && doctorId) {
          const doctorProfile = await getDoctorById(doctorId);
          setProfile((current) => ({
            ...current,
            ...doctorProfile,
            role: "doctor",
          }));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    loadProfile();
  }, [currentRole, doctorId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0F172A]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-8 flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-secondary">Profile</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {profile.role === "doctor" ? "Doctor Information" : "Patient Information"}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(profile.role === "doctor" ? "/doctor-dashboard" : "/my-appointments")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
              >
                {profile.role === "doctor" ? "Doctor Dashboard" : "View Appointments"}
              </button>
              <button
                onClick={() => setIsEditMode((current) => !current)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {isEditMode ? "Cancel" : "Edit Profile"}
              </button>
              {isEditMode && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Full Name</p>
              {isEditMode ? (
                <input
                  value={profile.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              ) : (
                <p className="mt-2 break-words text-2xl font-semibold">{profile.name || "Not set"}</p>
              )}
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Mobile Number</p>
              <p className="mt-2 break-words text-2xl font-semibold">{profile.mobile || "Not set"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-2 text-2xl font-semibold">{profile.role}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Gender</p>
              {isEditMode ? (
                <select
                  value={profile.gender}
                  onChange={(e) => handleFieldChange("gender", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Not set</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="mt-2 text-2xl font-semibold">{profile.gender || "Not set"}</p>
              )}
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Age</p>
              {isEditMode ? (
                <input
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) => handleFieldChange("age", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              ) : (
                <p className="mt-2 text-2xl font-semibold">{profile.age || "Not set"}</p>
              )}
            </div>
            {profile.role === "doctor" && (
              <>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Specialization</p>
                  {isEditMode ? (
                    <input
                      value={profile.specialization || ""}
                      onChange={(e) => handleFieldChange("specialization", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  ) : (
                    <p className="mt-2 text-2xl font-semibold">{profile.specialization || "Not set"}</p>
                  )}
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Qualification</p>
                  {isEditMode ? (
                    <input
                      value={profile.qualification || ""}
                      onChange={(e) => handleFieldChange("qualification", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  ) : (
                    <p className="mt-2 text-2xl font-semibold">{profile.qualification || "Not set"}</p>
                  )}
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Experience</p>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={profile.experience || ""}
                      onChange={(e) => handleFieldChange("experience", e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  ) : (
                    <p className="mt-2 text-2xl font-semibold">{profile.experience || "Not set"}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold mb-4">Address Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">State</p>
                {isEditMode ? (
                  <input
                    value={profile.state || ""}
                    onChange={(e) => handleFieldChange("state", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="mt-2 break-words text-lg font-medium">{profile.state || "Not set"}</p>
                )}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">District</p>
                {isEditMode ? (
                  <input
                    value={profile.district || ""}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="mt-2 break-words text-lg font-medium">{profile.district || "Not set"}</p>
                )}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                <p className="text-sm text-slate-500">Address</p>
                {isEditMode ? (
                  <input
                    value={profile.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p className="mt-2 break-words text-lg font-medium">{profile.address || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold mb-4">
              {profile.role === "doctor" ? "Doctor Details" : "Saved Doctors"}
            </h2>
            {profile.role === "doctor" ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-2 text-lg font-medium">{profile.email || "Not set"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Consultation Fee</p>
                  <p className="mt-2 text-lg font-medium">{profile.consultation_fee ? `₹${profile.consultation_fee}` : "Not set"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Hospital</p>
                  <p className="mt-2 text-lg font-medium">{profile.hospital_name || "Not set"}</p>
                  <p className="text-sm text-slate-600">{profile.hospital_city || ""}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">Dr. Ananya Singh</p>
                  <p className="text-sm text-slate-600">Cardiologist · Apollo Hospital</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">Dr. Rajiv Menon</p>
                  <p className="text-sm text-slate-600">General Physician · Fortis</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
