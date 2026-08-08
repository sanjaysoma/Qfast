import { motion } from "framer-motion";

function SpecialtyCard({ icon: Icon, asset, specialization, doctorCount, onClick, isMobile }) {
  if (isMobile) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex flex-col items-center gap-1 rounded-lg bg-white p-2 text-center shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-700 overflow-hidden">
          {asset ? (
            <img src={asset} alt={specialization} className="h-full w-full object-contain p-1" />
          ) : Icon ? (
            <Icon className="h-10 w-10" />
          ) : (
            <span className="text-4xl leading-none">🩺</span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-900">{specialization}</p>
        <p className="text-xs text-slate-500">{doctorCount} Doctors</p>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className="group w-full rounded-[16px] bg-white p-5 text-left shadow-sm transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-500 sm:p-6"
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-sky-50 text-sky-700 transition-colors duration-300 group-hover:bg-sky-100 sm:h-32 sm:w-32 overflow-hidden">
        {asset ? (
          <img src={asset} alt={specialization} className="h-full w-full object-contain p-2" />
        ) : Icon ? (
          <Icon className="h-14 w-14 sm:h-16 sm:w-16" />
        ) : (
          <span className="text-6xl leading-none">🩺</span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Specialty</p>
        <h3 className="mt-3 text-base font-semibold text-slate-900 sm:text-lg">{specialization}</h3>
        <p className="mt-3 text-sm text-slate-600">{doctorCount} Doctors Available</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Q<span className="text-cyan-600">Less</span>
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-300 group-hover:bg-slate-200">
          Book Now
        </span>
      </div>
    </motion.button>
  );
}

export default SpecialtyCard;
