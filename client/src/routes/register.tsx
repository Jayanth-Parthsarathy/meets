import { createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";
import { RegisterPayload } from "../types/auth";
import { regsiter } from "../utils/auth";

const Register = () => {
  const [email, setEmail] = createSignal("");
  const [name, setName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    try {
      e.preventDefault();
      const payload: RegisterPayload = {
        email: email(),
        name: name(),
        password: password(),
      };
      await regsiter(payload);
      navigate("/login");
    } catch (err) {
      console.log("Error with registration " + err);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-black text-gray-100">
      <div class="bg-gray-800 p-8 rounded shadow-md w-96">
        <h2 class="text-4xl p-4 font-bold mb-4 text-center">Meets ✨</h2>
        <h2 class="text-2xl font-bold mb-4">Register</h2>
        <form class="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label class="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              class="mt-1 p-2 w-full border rounded bg-gray-700 text-white"
              value={email()}
              onInput={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400">Name</label>
            <input
              type="text"
              class="mt-1 p-2 w-full border rounded bg-gray-700 text-white"
              value={name()}
              onInput={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400">
              Password
            </label>
            <input
              type="password"
              class="mt-1 p-2 w-full border rounded bg-gray-700 text-white"
              value={password()}
              onInput={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" class="bg-blue-500 text-white p-2 rounded">
            Register
          </button>
        </form>
        <p class="underline italic text-xs mt-3">
          Existing user?
          <A href="/login" class="font-bold non-italic text-blue-300 ml-1">
            Login
          </A>
        </p>
      </div>
    </div>
  );
};

export default Register;
