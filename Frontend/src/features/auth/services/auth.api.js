import axios from "axios";

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true, // Crucial for sending HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Register user
export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post("/register", { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during registration" };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during login" };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const response = await api.post("/logout");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during logout" };
  }
};

// Get current user profile
export const getProfile = async () => {
  try {
    const response = await api.get("/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user profile" };
  }
};

export default api;
