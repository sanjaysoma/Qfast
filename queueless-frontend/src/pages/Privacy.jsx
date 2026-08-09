import { Link } from "react-router-dom";

function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 max-w-3xl text-gray-700">
          VDocQ is committed to protecting your privacy. We collect only the information needed
          to provide appointment search and booking services, including location data when you choose to share it.
        </p>

        <section className="mt-10 space-y-4 text-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">What we collect</h2>
            <p className="mt-1">
              We may collect personal details such as your name, contact information, and appointment preferences
              when you register or book a visit.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">How we use your information</h2>
            <p className="mt-1">
              Your data is used to improve search results, manage bookings, and personalize your experience on VDocQ.
              We never sell your personal information to third parties.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Location permissions</h2>
            <p className="mt-1">
              If you allow location access, we use it to suggest nearby hospitals and doctors. You can always opt out and choose your city manually.
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

export default Privacy;


