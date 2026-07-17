import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setUser(null);
        } else {
          console.error("Error loading user:", err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

 const login = async (email, password) => {

  const res = await api.post("/login", {

    email,

    password,

  });
 
  localStorage.setItem("user", JSON.stringify(res.data));
 
  setUser(res.data);

  return res.data;

};
 

  const register = async (name, email, password, role) => {
    const res = await api.post("/register", {
      name,
      email,
      password,
      role,
    });

    return res.data;
  };

 const logout = async () => {
  await api.get("/logout");
 
  localStorage.removeItem("user");
 
  setUser(null);
};
  // ✅ Update user after profile edit or avatar upload
  const updateUser = (newData) => {
    setUser((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        setUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);