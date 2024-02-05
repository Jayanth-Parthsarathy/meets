import { axios } from "./axios";
const logout = async (e: Event) => {
  try {
    e.preventDefault();
    await axios.post("api/auth/logout");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  } catch (err) {
    console.log("Error with registration " + err);
  }
};
