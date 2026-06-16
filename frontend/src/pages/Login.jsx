import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.post("/auth/login", form);

      localStorage.setItem("token", data.token);
      login(data.user, data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setMsg(err.response?.data?.msg || "Login failed");
    }
  };

 return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
             <span className="text-white text-3xl font-bold">AI</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-500 mt-2">Please enter your details to sign in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900"
              required
            />
          </div>

          <div>
            <div className="flex justify-between mb-2 ml-1">
               <label className="text-sm font-semibold text-slate-700">Password</label>
               <span className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">Forgot?</span>
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900"
              required
            />
          </div>

          <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-100 mt-2">
            Sign In
          </button>
        </form>

        {msg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm text-center font-medium">{msg}</p>
          </div>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">or continue with</span></div>
        </div>

        <p className="text-center text-slate-600 font-medium">
          New to PrepAI?{" "}
          <span
            onClick={() => (window.location.href = "/register")}
            className="text-blue-600 cursor-pointer hover:text-blue-700 hover:underline transition-colors"
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;