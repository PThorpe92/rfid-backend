import { A } from "@solidjs/router";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <div class="flex flex-col items-center justify-center h-screen">
        <h1 class="text-4xl font-mono mb-10 underline">
          MVCF Resident Attendance
        </h1>
        <div class="grid gap-10 grid-cols-1 md:grid-cols-2 mt-10">
          <A href="/scan" class="btn btn-primary btn-lg">
            Active Scan
          </A>
          <A href="/monitor" class="btn btn-accent btn-lg">
            Monitor/Display Only
          </A>
          <A href="/reports" class="btn btn-accent btn-lg">
            View Reports
          </A>
          <A href="/admin" class="btn btn-primary btn-lg">
            Admin Page
          </A>
        </div>
      </div>
    </>
  );
}

export default App;
