import { JSXElement, createSignal } from "solid-js";
import { API } from "../api/api";
import { toast } from "solid-toast";
import Navbar from "../components/Navbar";
import { SUser } from "../models/models";

function Login(): JSXElement {

  const [form, setForm] = createSignal({ email: "", password: "" });
  const [error, setError] = createSignal("");
  const [users, setUsers] = createSignal<SUser[]>([]);

  async function getUsers(): Promise<void> {
    const response = await API.GET("users");
    if (response !== undefined && response.success) {
      setUsers(response.data as SUser[]);
      console.log(response.data);
      toast.success("Users retrieved successfully");
    } else {
      toast.error(response?.message);
    }
  }

  async function handleSubmit(): Promise<void> {
    const response = await API.POST("auth/login", form());
    if (response && response.success) {
      toast.success("Login successful");
    } else {
      setError("Invalid username or password");
      toast.error(response?.message);
    }
  };

  return (
    <>
      <Navbar />
      <div class="flex flex-col items-center justify-center">
        <div class="flex-col align-top">
          <div class="col-md-2 offset-md-3">
            <div class="card">
              <div class="card-body">
                <h1 class="card-title text-blue-300 text-2xl">Login</h1>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="text"
                    class="input input-bordered w-full max-w-xs"
                    id="email"
                    value={form().email}
                    onInput={(e) => setForm({ ...form(), email: e.currentTarget.value })}
                  />
                </div>
                <div class="form-group">
                  <label for="password">Password</label>
                  <input type="password"
                    class="input input-bordered w-full max-w-xs"
                    id="password"
                    value={form().password}
                    onInput={(e) => setForm({ ...form(), password: e.currentTarget.value })}
                  />
                </div>
                <button class="btn btn-outline" onclick={handleSubmit}>Login</button>
                <button class="btn btn-outline" onClick={getUsers}>Get Users</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} export default Login;
