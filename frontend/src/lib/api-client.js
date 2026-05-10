import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

let clerkToken = null;

export const setClerkToken = (token) => {
  clerkToken = token;
};

export const getClerkToken = () => clerkToken;

api.interceptors.request.use((config) => {
  const token = getClerkToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setClerkToken(null);
    }
    return Promise.reject(err);
  },
);

export default api;