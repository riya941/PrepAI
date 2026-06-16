import { useNavigate } from "react-router-dom";




function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">

      {/* 🔷 NAVBAR */}
      <div className="flex justify-between items-center px-10 py-5">

        <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">
          prepAI
        </h1>

        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Sign In
        </button>

      </div>

      {/* 🔷 HERO SECTION */}
      <div className="text-center mt-20 px-6">

        <h2 className="text-5xl font-bold text-gray-800 leading-tight">
          Crack Your Interviews with{" "}
          <span className="text-blue-600">AI Power</span>
        </h2>

        <p className="text-gray-500 mt-6 text-lg max-w-2xl mx-auto">
          Practice technical and HR interviews, get real-time feedback,
          and boost your resume with AI-driven insights 🚀
        </p>

        <div className="mt-10 flex justify-center gap-4">

          <button
            onClick={() => navigate("/register")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-blue-700 transition"
          >
            Get Started 🚀
          </button>

          <button
            onClick={() => navigate("/login")}
            className="border border-gray-300 px-6 py-3 rounded-xl text-lg text-gray-700 hover:bg-gray-100 hover:text-black transition"
          >
            Login
          </button>

        </div>

      </div>

      {/* 🔷 FEATURES SECTION */}
      <div className="mt-24 px-10">

        <h3 className="text-3xl font-semibold text-center mb-12">
          Why Choose prepAI?
        </h3>

        <div className="grid grid-cols-3 gap-8">

          {/* FEATURE 1 */}
          <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">🎤 AI Mock Interviews</h4>
            <p className="text-gray-500">
              Experience real interview simulations with AI-generated questions.
            </p>
          </div>

          {/* FEATURE 2 */}
          <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">📊 Smart Feedback</h4>
            <p className="text-gray-500">
              Get detailed performance analysis and improvement suggestions.
            </p>
          </div>

          {/* FEATURE 3 */}
          <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3">📄 Resume Booster</h4>
            <p className="text-gray-500">
              Analyze your resume with ATS scoring and optimize for jobs.
            </p>
          </div>

        </div>

      </div>

      {/* 🔷 CALL TO ACTION */}
      <div className="mt-24 text-center pb-20">

        <h3 className="text-3xl font-bold text-gray-800">
          Ready to Level Up Your Career?
        </h3>

        <button
          onClick={() => navigate("/register")}
          className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl text-lg hover:bg-blue-700 transition"
        >
          Start Now 🚀
        </button>

      </div>

    </div>
  );
}

export default Home;
