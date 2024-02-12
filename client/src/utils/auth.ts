import { axios } from "./axios";
import { LoginPayload, RegisterPayload } from "../types/auth";

export const logout = async (e: Event) => {
  try {
    e.preventDefault();
    await axios.post("api/auth/logout");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  } catch (err) {
    console.log("Error with registration " + err);
  }
};

export const login = async (payload: LoginPayload) => {
  await axios.post("api/auth/login", payload);
};

export const regsiter = async (payload: RegisterPayload) => {
  await axios.post("api/auth/register", payload);
};
