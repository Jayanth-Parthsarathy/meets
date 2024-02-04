import { axios } from "../utils/axios";
import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
const Login = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    try {
      e.preventDefault();
      const payload = {
        email: email(),
        password: password(),
      };
      await axios.post("api/auth/login", payload);
      navigate("/");
    } catch (err) {
      console.log("Error with registration " + err);
    }
  };

  const logout = async (e: Event) => {
    try {
      e.preventDefault();
      await axios.post("api/auth/logout");
      localStorage.removeItem("userId");
    } catch (err) {
      console.log("Error with registration " + err);
    }
  };
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-96">
        <h2 class="text-2xl font-bold mb-4">Login</h2>
        <form class="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label class="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              class="mt-1 p-2 w-full border rounded"
              value={email()}
              onInput={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              class="mt-1 p-2 w-full border rounded"
              value={password()}
              onInput={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" class="bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </form>
        <button class="bg-red-500 text-white p-2 rounded" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Login;
