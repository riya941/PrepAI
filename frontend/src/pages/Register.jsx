import { useState } from "react";
import API from "../services/api";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", form);
      setMsg("Registration Successful! Go to Login.");
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error occurred");
    }
  };

  return (
    /* Matches the Login page background */
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 md:px-8">
      
      {/* Centering Container */}
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-2rem)] py-10">
        
        {/* White Card Box */}
        <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md border border-slate-100 mx-auto">
          
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4 shadow-md shadow-blue-100">
               <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-500 mt-2">Join PrepAI to start your journey</p>
          </div>

          <form  autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@gmail.com"
                autoComplete="new-email"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-100 mt-4">
              Register
            </button>
          </form>

          {msg && (
            <div className={`mt-6 p-3 rounded-lg border text-sm text-center font-medium ${
              msg.includes("Successful") 
              ? "bg-green-50 border-green-100 text-green-600" 
              : "bg-red-50 border-red-100 text-red-600"
            }`}>
              {msg}
            </div>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-medium">Already have an account?</span></div>
          </div>

          <p className="text-center text-slate-500 font-medium text-sm">
            Already registered?{" "}
            <span
              onClick={() => (window.location.href = "/login")}
              className="text-blue-600 cursor-pointer hover:text-blue-700 hover:underline transition-colors font-semibold"
            >
              Sign In
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;
