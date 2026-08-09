import { Link } from "react-router-dom";

function Faq() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">About VDocQ</h1>
        <p className="mt-4 max-w-3xl text-gray-700">
          VDocQ is a digital healthcare assistant that helps you find doctors, hospitals,
          and available appointments quickly. Our mission is to reduce waiting time, simplify
          bookings, and deliver better access to care across cities.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold">How do I book an appointment?</h3>
              <p className="mt-1">
                Search for a doctor or hospital, select your preferred city, and book an available time slot.
                If you are a registered patient, you can manage your appointments from your dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Can I choose a hospital in another city?</h3>
              <p className="mt-1">
                Yes. VDocQ allows you to search by city and specialization so you can book care where it is most convenient.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Do I need an account?</h3>
              <p className="mt-1">
                You can browse hospitals and doctors without signing in, but registering makes booking and appointment management easier.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/" className="inline-flex min-h-11 items-center text-blue-600 hover:underline">â† Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Faq;


