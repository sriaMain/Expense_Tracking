import axios from "axios";
import store from "../store";

const axiosRefresh = axios.create({
  // baseURL: "http://72.61.240.147/api/"
  baseURL: "http://192.168.0.113:8000/api/",
  // withCredentials: true,
});

const axiosInstance = axios.create({
  // baseURL: "http://72.61.240.147/api/"
  baseURL: "http://192.168.0.113:8000/api/",
  // withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  console.log("Attaching token to request:", token);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('login/')
    ) {
      originalRequest._retry = true;
      try {
        const response = await axiosRefresh.post("/accounts/refresh/", {
          // withCredentials: true,
        });
        store.dispatch({
          type: "auth/setAccessToken",
          payload: { accessToken: response.data.token },
        });
        originalRequest.headers["Authorization"] = "Bearer " + response.data.token;
        return axiosInstance(originalRequest);
      } catch (err) {
        store.dispatch({
          type: "auth/logoutSuccess",
        });
        window.location.href = "/";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
