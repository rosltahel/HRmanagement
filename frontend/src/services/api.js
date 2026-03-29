import axios from "axios";

//Instead of calling the backend everywhere → i control everything from one place
const API = axios.create({
  baseURL: "http://localhost:8001",
});


API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;  