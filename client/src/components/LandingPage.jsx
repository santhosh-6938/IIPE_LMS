import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaUsersCog,
  FaCheckSquare,
  FaEnvelopeOpenText,
  FaArchive,
  FaUserShield,
  FaUserFriends,
  FaCode,
  FaRobot,
  FaComments,
  FaMapMarkerAlt,
} from "react-icons/fa";

const features = [
  {
    icon: <FaUserShield className="w-10 h-10 text-blue-600" />,
    title: "Role-Based Access",
    desc: "Personalized dashboards for Teachers, Students, Co-Teachers, and Admin ensure everyone has access to only the features they need.",
  },
  {
    icon: <FaUsersCog className="w-10 h-10 text-cyan-600" />,
    title: "Unique Classroom Creation",
    desc: "Composite classroom ID and easy workflow. Every class is uniquely identified and easy to manage.",
  },
  {
    icon: <FaUserFriends className="w-10 h-10 text-green-600" />,
    title: "Co-Teacher Support",
    desc: "Invite a co-teacher to collaborate on teaching and classroom management seamlessly.",
  },
  {
    icon: <FaCheckSquare className="w-10 h-10 text-orange-600" />,
    title: "Attendance Management",
    desc: "Teachers mark attendance; students see detailed feedback and reports.",
  },
  {
    icon: <FaRobot className="w-10 h-10 text-red-600" />,
    title: "Automatic Task Submission",
    desc: "Tasks are auto-submitted via Node-Cron. Never worry about missing a deadline.",
  },
  {
    icon: <FaComments className="w-10 h-10 text-fuchsia-600" />,
    title: "Interactive Group Chat",
    desc: "Real-time chat for live collaboration and instant doubt resolution.",
  },
  {
    icon: <FaEnvelopeOpenText className="w-10 h-10 text-yellow-500" />,
    title: "Email Verification & Login Detection",
    desc: "Secure your account with verification. All concurrent logins are detected and managed.",
  },
  {
    icon: <FaArchive className="w-10 h-10 text-violet-600" />,
    title: "Class Archiving",
    desc: "Archive classrooms at the end of semester for clean record keeping and future audits.",
  },
];

const IIPE_MAP_URL = "https://maps.app.goo.gl/PpvkGSFUBgtNTTWU8";

const iipeDetails = {
  logo: "/iipe-logo.png",
  name: "Indian Institute of Petroleum & Energy",
  abbr: "IIPE",
  tagline: "Pioneering Education in Petroleum and Energy",
  about:
    "IIPE is an Institute of National Importance (INI) under the Ministry of Petroleum & Natural Gas, Government of India, shaping future leaders for the energy sector with cutting-edge academics and research.",
  address: (
    <>
      2nd Floor, Main Building, AU College of Engineering Campus,
      <br />
      Andhra University, Visakhapatnam, Andhra Pradesh – 530003, India
    </>
  ),
  website: "https://iipe.ac.in",
};

function FeatureCarousel({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const max = items.length;

  useEffect(() => {
    timerRef.current = setTimeout(() => setIdx((i) => (i + 1) % max), 4500);
    return () => clearTimeout(timerRef.current);
  }, [idx, max]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % max);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + max) % max);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [max]);

  return (
    <div className="relative max-w-lg mx-auto group">
      <div className="overflow-hidden rounded-3xl backdrop-blur-md border border-blue-200/40 shadow-2xl bg-gradient-to-br from-white/70 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-950/60 h-72 flex items-center justify-center transition-all duration-700">
        {items.map((f, i) => (
          <div
            key={f.title}
            className={`absolute w-full h-full flex flex-col items-center justify-center px-8 transition-all duration-700 transform ${
              i === idx
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-90 z-0"
            }`}
          >
            <div className="animate-bounce">{f.icon}</div>
            <h3 className="mt-4 text-xl font-extrabold text-slate-800 dark:text-slate-100 text-center drop-shadow-sm">
              {f.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-center mt-3 text-base leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <button
        aria-label="Previous"
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full p-3 shadow-lg backdrop-blur transition-all"
        onClick={() => setIdx((i) => (i - 1 + max) % max)}
      >
        ‹
      </button>
      <button
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full p-3 shadow-lg backdrop-blur transition-all"
        onClick={() => setIdx((i) => (i + 1) % max)}
      >
        ›
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              i === idx
                ? "bg-blue-700 border-blue-800 dark:bg-blue-300 dark:border-blue-400 scale-110"
                : "bg-slate-300 border-slate-400 dark:bg-slate-600 dark:border-slate-700 hover:scale-110"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const LandingPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-slate-100 to-blue-200 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 min-h-screen font-inter">
      <section className="py-16 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 dark:text-blue-200 mb-4 tracking-tight drop-shadow-md">
          Welcome to IIPE LMS
        </h1>
        <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-6 leading-relaxed">
          All your classes, collaboration, and assessments—smarter and more
          secure. Experience the next-gen academic journey.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 border border-blue-200 bg-white dark:bg-slate-950 dark:border-blue-400 text-blue-700 dark:text-blue-200 font-semibold rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all"
          >
            Register
          </Link>
        </div>

        <button
          onClick={() =>
            document.getElementById("usps")?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-6 text-blue-700 dark:text-blue-300 hover:underline text-base group flex items-center gap-1 font-medium"
        >
          <span>See LMS Unique Features</span>
          <span className="group-hover:translate-y-1 transition-transform">↓</span>
        </button>
      </section>

      <section className="py-12 flex flex-col items-center text-center bg-gradient-to-b from-blue-100/60 to-blue-50/40 dark:from-blue-950 dark:to-slate-950 shadow-inner">
        <img
          src={iipeDetails.logo}
          alt="IIPE Logo"
          className="mb-3 w-20 h-20 rounded-full shadow-lg ring-4 ring-blue-300 dark:ring-blue-700 bg-white dark:bg-slate-800 p-2 hover:scale-105 transition-transform"
          onError={(e) => (e.target.style.display = "none")}
        />
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500 dark:from-blue-300 dark:to-cyan-300 mb-2">
          {iipeDetails.abbr} - {iipeDetails.name}
        </h2>
        <p className="text-blue-900 dark:text-blue-200 font-medium text-lg">
          {iipeDetails.tagline}
        </p>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-2xl mx-auto text-base leading-relaxed">
          {iipeDetails.about}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a
            href={iipeDetails.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gradient-to-r from-blue-700 to-cyan-600 text-white rounded-lg shadow-md hover:shadow-xl transition-all font-semibold hover:scale-105"
          >
            Visit IIPE Homepage
          </a>
          <a
            href={IIPE_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white border border-blue-300 text-blue-700 dark:bg-slate-900 dark:border-blue-500 dark:text-blue-200 rounded-lg shadow-md hover:bg-blue-100 hover:scale-105 flex items-center gap-2 font-semibold transition-all"
          >
            <FaMapMarkerAlt className="w-5 h-5" /> IIPE Maps
          </a>
        </div>

        <div className="text-sm text-blue-900/70 dark:text-blue-100/70 mt-4 leading-relaxed">
          {iipeDetails.address}
        </div>
      </section>

      <section id="usps" className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500 dark:from-blue-300 dark:to-cyan-400">
          Why Use IIPE LMS?
        </h2>
        <FeatureCarousel items={features} />
      </section>

      <section className="max-w-6xl mx-auto px-6 my-16 text-center">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl border border-blue-200/40 dark:border-blue-700 p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/40 transition-all duration-500">
          <div className="flex-1 text-left">
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <FaCode className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Try
              the IIPE Code Compiler
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-base mb-3 leading-relaxed">
              In-browser code compiler for placement, teaching, and assignments.
              Practice/test C, C++, Java, and Python within LMS.
            </p>
            <Link
              to="/compiler"
              className="inline-block mt-3 px-6 py-3 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg shadow-md hover:shadow-xl font-semibold transition-all"
            >
              Try Coding Compiler Demo
            </Link>
          </div>

          <div className="flex-1 flex justify-center items-center mt-8 md:mt-0">
            <FaCode className="w-32 h-32 md:w-40 md:h-40 text-cyan-400/20 dark:text-cyan-400/10 animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
