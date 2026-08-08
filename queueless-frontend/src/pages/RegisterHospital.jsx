import { useMemo, useState } from "react";
import API from "../api/axios";
import { INDIA_STATES, INDIA_STATE_DISTRICTS } from "../data/indiaStateDistricts";

function RegisterHospital() {

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        state: "",
        district: "",
        pincode: "",
        google_maps_link: "",
        phone: "",
        email: "",
        dmho_certificate: null,
    });

    // =========================
    // Handle Input Change
    // =========================

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "state") {
            setFormData({
                ...formData,
                state: value,
                district: "",
            });
            return;
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const districtOptions = useMemo(
        () => (formData.state ? Array.from(new Set(INDIA_STATE_DISTRICTS[formData.state] || [])) : []),
        [formData.state]
    );

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;

        setFormData({
            ...formData,
            dmho_certificate: file,
        });
    };

    // =========================
    // Submit Form
    // =========================

    const handleSubmit = async () => {

        try {

            if (!formData.name || !formData.address) {
                alert("Please fill in the hospital name and address.");
                return;
            }

            if (!formData.google_maps_link) {
                alert("Please provide the Google Maps location link.");
                return;
            }

            if (!formData.dmho_certificate) {
                alert("Please upload the DMHO certificate in JPG format.");
                return;
            }

            const fileName = formData.dmho_certificate.name.toLowerCase();
            const isJpg = fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");

            if (!isJpg) {
                alert("DMHO certificate must be a JPG file.");
                return;
            }

            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("address", formData.address);
            payload.append("city", formData.city || "");
            payload.append("state", formData.state || "");
            payload.append("district", formData.district || "");
            payload.append("pincode", formData.pincode || "");
            payload.append("google_maps_link", formData.google_maps_link);
            payload.append("phone", formData.phone || "");
            payload.append("email", formData.email || "");
            payload.append("dmho_certificate", formData.dmho_certificate);

            await API.post(
                "/hospital/register",
                payload
            );

            alert("Hospital registered successfully.");
            window.location.href = "/hospitals";

        } catch (error) {

            console.log(error);
            console.log(error.response?.data);
            alert("Hospital Registration Failed");
        }
    };

    return (

        <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

            <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow sm:p-8">

                <h1 className="text-3xl font-bold mb-8">

                    Register Hospital

                </h1>

                <h2 className="text-xl font-semibold mb-4">

                    Hospital Information

                </h2>

                <div className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <div className="font-semibold mb-1">Location details</div>
                    <div className="text-sm">
                        <p>Paste a Google Maps link so patients can open the hospital location quickly.</p>
                        <p className="mt-1">Example: <span className="font-semibold">https://maps.google.com/?q=17.4239,78.4738</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <input
                        type="text"
                        name="name"
                        placeholder="Hospital Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    >
                        <option value="">Select State</option>
                        {INDIA_STATES.map((stateName) => (
                            <option key={stateName} value={stateName}>
                                {stateName}
                            </option>
                        ))}
                    </select>

                    <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                        disabled={!formData.state}
                    >
                        <option value="">{formData.state ? "Select District" : "Select State First"}</option>
                        {districtOptions.map((districtName) => (
                            <option key={districtName} value={districtName}>
                                {districtName}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <input
                        type="url"
                        name="google_maps_link"
                        placeholder="Google Maps Link"
                        value={formData.google_maps_link}
                        onChange={handleChange}
                        className="w-full rounded border p-3 sm:col-span-2"
                        required
                    />

                    <input
                        type="text"
                        name="phone"
                        placeholder="Hospital Phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Hospital Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded border p-3"
                    />

                    <div className="sm:col-span-2">
                        <label className="mb-2 block font-medium">
                            DMHO Certificate (JPG) <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="file"
                            name="dmho_certificate"
                            accept=".jpg,.jpeg,image/jpeg"
                            onChange={handleFileChange}
                            className="w-full rounded border p-3"
                            required
                        />
                    </div>

                </div>

                {/* Submit Button */}

                <button
                    onClick={handleSubmit}
                    className="mt-8 w-full rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 sm:w-auto"
                >
                    Register Hospital
                </button>

            </div>

        </div>
    );
}

export default RegisterHospital;