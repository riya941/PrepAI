import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("prepai_user")) || null
  );

  const [token, setToken] = useState(
    localStorage.getItem("prepai_token") || null
  );

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);

    localStorage.setItem("prepai_user", JSON.stringify(userData));
    localStorage.setItem("prepai_token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("prepai_user");
    localStorage.removeItem("prepai_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
