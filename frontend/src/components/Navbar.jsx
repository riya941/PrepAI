import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useState, useEffect } from "react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-menu")) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


  return (
    <div className="flex justify-between items-center px-10 py-4 border-b bg-white">

      {/* LEFT */}
      <div className="flex items-center gap-8">

        {/* LOGO */}
        <h1
          onClick={() => navigate("/dashboard")}
          className="text-2xl font-bold text-blue-600 cursor-pointer"
        >
          prepAI
        </h1>

        {/* NAV LINKS */}
        <div className="flex gap-6 text-gray-600 font-medium">

          {/* Resume Booster */}
          <span
            onClick={() => navigate("/resume-booster")}
            className={`cursor-pointer hover:text-blue-600 ${location.pathname === "/resume-booster"
              ? "border-b-2 border-blue-600 text-blue-600 pb-1"
              : ""
              }`}
          >
            Resume Booster
          </span>

          {/* Interview Prep */}
          <span
            onClick={() => navigate("/dashboard")}
            className={`cursor-pointer hover:text-blue-600 ${location.pathname === "/dashboard"
              ? "border-b-2 border-blue-600 text-blue-600 pb-1"
              : ""
              }`}
          >
            Interview Preparation
          </span>

        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="relative profile-menu">

          {/* PROFILE ICON */}
          <div
            onClick={(e) => {
              e.stopPropagation();   // 🔥 IMPORTANT
              setOpen(!open);
            }}
            className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div
              onClick={(e) => e.stopPropagation()}  // 🔥 IMPORTANT
              className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg text-gray-800 z-50"
            >
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate("/progress")}
              >
                📊 Progress
              </div>

              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
                onClick={handleLogout}
              >
                🚪 Logout
              </div>

            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Navbar;