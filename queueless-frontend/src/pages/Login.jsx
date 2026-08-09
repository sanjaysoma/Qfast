import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const [role, setRole] = useState("patient");
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const normalizedMobile = mobile.replace(/\D/g, "").slice(0, 10);

    const handleLogin = async () => {
        if (normalizedMobile.length !== 10) {
            alert("Enter valid mobile number");
            return;
        }

        try {
            setLoginLoading(true);
            const response = await API.post(
                "/auth/login",
                {
                    name: name.trim() || undefined,
                    mobile: normalizedMobile,
                    role,
                }
            );

            if (response.data.role === "patient") {
                sessionStorage.setItem("patient_token", response.data.access_token);
                sessionStorage.setItem("patient_id", response.data.patient_id);
            } else if (response.data.role === "doctor") {
                sessionStorage.setItem("doctor_token", response.data.access_token);
                sessionStorage.setItem("doctor_id", response.data.doctor_id);
            }

            sessionStorage.setItem("current_role", response.data.role);

            const profileData = {
                name: response.data.name || name,
                mobile: normalizedMobile,
                role: response.data.role,
                age: response.data.age || "",
                gender: response.data.gender || "",
                state: response.data.state || "",
                district: response.data.district || "",
            };
            sessionStorage.setItem("profile_data", JSON.stringify(profileData));

            if (response.data.name) {
                sessionStorage.setItem("name", response.data.name);
            }

            alert("Login Successful");

            const fromLocation = location.state?.from;
            const redirectPath = "/";
            const redirectState = fromLocation?.state;

            navigate(redirectPath, {
                state: redirectState,
                replace: true,
            });
        } catch (error) {
            console.log(error);
            const status = error.response?.status;
            if (!status) {
                alert("Unable to reach server. Please check internet connection and backend URL.");
                return;
            }
            alert(error.response?.data?.detail || "Login failed. Please check your credentials.");
        } finally {
            setLoginLoading(false);
        }
    };

    const canLogin = !loginLoading;

    return (

        <div className="min-h-screen bg-gray-100 px-4 py-6 lg:px-8">

            <div className="mx-auto w-full max-w-6xl rounded-xl bg-white p-6 shadow-lg sm:p-8">

                {/* Back Button */}

                <button
                    onClick={() => navigate("/")}
                    className="mb-4 inline-flex min-h-11 items-center text-blue-500"
                >
                    {"<- Back to home"}
                </button>

                {/* Heading */}

                <h1 className="text-3xl font-bold"><span className="text-blue-500">VDocQ</span>{" "}Login</h1>

                <p className="text-gray-500 mt-2">

                    Enter your credentials to access your account

                </p>

                {/* Role Selection */}

                <div className="mt-6 lg:col-span-2">

                    <p className="mb-2 font-medium">

                        Login as

                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">

                        {/* Patient */}

                        <button
                            onClick={() => setRole("patient")}
                            className={`flex-1 rounded-lg border py-3 sm:py-2 ${
                                role === "patient"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white"
                            }`}
                        >
                            Patient
                        </button>

                        {/* Doctor */}

                        <button
                            onClick={() => setRole("doctor")}
                            className={`flex-1 rounded-lg border py-3 sm:py-2 ${
                                role === "doctor"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white"
                            }`}
                        >
                            Doctor
                        </button>

                    </div>

                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {/* Full Name */}
                    <div>
                        <label className="block mb-2">Full Name</label>
                        <input
                            type="text"
                            placeholder="Optional for existing account"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <label className="block mb-2">Mobile Number</label>
                        <input
                            type="tel"
                            placeholder="Enter your Mobile Number"
                            value={mobile}
                            onChange={(e) => {
                                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                            }}
                            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                </div>

                {/* Login Button */}

                <button
                    onClick={handleLogin}
                    disabled={!canLogin}
                    className="mt-6 w-full rounded-lg bg-blue-500 py-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loginLoading ? "Logging in..." : "Login"}
                </button>

                {/* Register */}

                <p className="text-center mt-6">

                    Don't have an account?

                    <span
                        onClick={() => navigate("/register")}
                        className="text-blue-500 cursor-pointer ml-1"
                    >
                        Sign up
                    </span>

                </p>

            </div>

        </div>
    );
}
