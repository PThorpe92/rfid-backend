import { JSXElement } from "solid-js";
import { A } from "@solidjs/router";
import Navbar from "../components/Navbar.jsx";

function Annex(): JSXElement {

  return (
    <>
      <Navbar />
      <div class="flex flex-col items-center justify-center h-screen">
        <h1 class="text-4xl font-mono mb-10 underline">
          MVCF Annex
        </h1>
        <div class="grid gap-10 grid-cols-1 md:grid-cols-2 mt-10">
          <A href="/scan" class="btn btn-primary btn-lg">
            Active Order
          </A>
          <A href="/annex/items" class="btn btn-accent btn-lg">
            Items
          </A>
          <A href="/reports" class="btn btn-accent btn-lg">
            View Reports
          </A>
          <A href="/admin" class="btn btn-primary btn-lg">
            Accounts
          </A>
        </div>
      </div>
    </>
  );
} export default Annex;
