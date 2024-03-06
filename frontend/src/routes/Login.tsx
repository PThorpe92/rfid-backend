import { JSXElement, createSignal } from "solid-js";
import { API } from "../api/api";
import { Toaster, toast } from "solid-toast";
import Navbar from "../components/Navbar";
import { SUser } from "../models/models";
import { A } from "@solidjs/router";

function Login(): JSXElement {

  const [form, setForm] = createSignal({ email: "", password: "" });
  const [error, setError] = createSignal("");
  const [isLoggedIn, setIsLoggedIn] = createSignal(sessionStorage.getItem("isLoggedIn") === "true" ? true : false);

  async function handleSubmit(): Promise<void> {
    const response = await API.POST("auth/login", form());
    if (response.success) {
      toast.success(response.message);
      sessionStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    } else {
      setError("Invalid username or password");
      toast.error(response?.message);
      sessionStorage.setItem("isLoggedIn", "false");
      setIsLoggedIn(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          className: "toast",
          duration: 4000,
          style: {
            background: "#2b2b2b",
            color: "#02eb48",
          },
        }}
      />
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
                <A class="btn btn-outline" href={isLoggedIn() ? "/annex" : ""}>Annex Menu</A>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} export default Login;
