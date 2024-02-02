import { createSignal } from "solid-js";
import { axios } from "../utils/axios";
import { useNavigate } from "@solidjs/router";

const Register = () => {
  const [email, setEmail] = createSignal("");
  const [name, setName] = createSignal("");
  const [password, setPassword] = createSignal("");
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    try {
      e.preventDefault();
      const payload = {
        email: email(),
        name: name(),
        password: password(),
      };
      const response = await axios.post("api/auth/register", payload);
      navigate("/login");
    } catch (err) {
      console.log("Error with registration " + err);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-96">
        <h2 class="text-2xl font-bold mb-4">Register</h2>
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
            <label class="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              class="mt-1 p-2 w-full border rounded"
              value={name()}
              onInput={(e) => setName(e.target.value)}
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
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
