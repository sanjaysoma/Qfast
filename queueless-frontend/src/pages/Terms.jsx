import { Link } from "react-router-dom";

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Terms & Conditions</h1>
        <p className="mt-4 max-w-3xl text-gray-700">
          These terms govern your use of VDocQ. By using the service, you agree to follow these guidelines and respect the rights of healthcare providers and other users.
        </p>

        <section className="mt-10 space-y-4 text-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Use of Service</h2>
            <p className="mt-1">
              VDocQ provides access to hospital and doctor booking services. Information is provided for convenience and informational purposes only.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">User responsibility</h2>
            <p className="mt-1">
              You are responsible for providing accurate information and keeping your account secure. Appointment details are subject to confirmation by the healthcare provider.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Limitation of liability</h2>
            <p className="mt-1">
              VDocQ is not a medical provider. We are not liable for medical decisions, treatment outcomes, or third-party services booked through the app.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/" className="inline-flex min-h-11 items-center text-blue-600 hover:underline">â† Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Terms;


