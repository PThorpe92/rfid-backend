import { JSXElement } from "solid-js";
import { A } from "@solidjs/router";

function Navbar(): JSXElement {
  return (
    <div class="navbar bg-base-100">
      <div class="navbar-start">
        <A class="btn btn-ghost normal-case text-xl font-mono" href="/">
          MVCF Menu
        </A>
      </div>
      <div class="navbar-right">
        <ul class="menu menu-horizontal p-0 font-mono">
          <li>
            <A href="/admin">Admin Portal</A>
          </li>
          <li>
            <A href="/reports">Reports</A>
          </li>
          <li>
            <A href="/scan">Active Scan</A>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
