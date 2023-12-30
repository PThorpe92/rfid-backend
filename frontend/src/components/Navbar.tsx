import { JSXElement } from 'solid-js';
import { A } from '@solidjs/router';

function Navbar(): JSXElement {
  const locId = localStorage.getItem('locationID');
  const handleClear = () => {
    localStorage.clear();
    location.reload();
  }
  return (
    <div class="navbar bg-base-100">
      <div class="navbar-start">
        <A class="btn btn-ghost normal-case text-xl font-mono" href="/">MVCF Menu</A>
      </div>
      <div class="navbar-center">
        <ul class="menu menu-horizontal p-0 font-mono">
          <li><A href="/admin">Admin Portal</A></li>
          <li><A href="/reports">Reports</A></li>
          <li><A href="/active-scan">Active Scan</A></li>
        </ul>{
          locId !== null ?
            <button class="btn btn-ghost outline" onClick={handleClear}>Reset ID:{locId}</button>
            : <h3 class="font-mono text-l">...</h3>
        }
      </div>
    </div>
  );
}

export default Navbar;
