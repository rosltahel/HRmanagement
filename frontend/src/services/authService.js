import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8001", // FastAPI URL
});

// Add Authorization header automatically if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const setPassword = (data) => API.post("/set-password", data);
export const loginUser = (data) => API.post("/login", data);
export const registerUser = (data) => API.post("/register", data);
export const forgotPassword = (data) => API.post("/forgot-password", data); // ✅ fixed