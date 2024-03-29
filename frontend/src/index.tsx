/* @refresh reload */
import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import ActiveScan from "./routes/ActiveScan";
import ViewReports from "./routes/Reports";
import Admin from "./routes/Admin";
import "./input.css";
import App from "./App";
import Monitor from "./routes/Monitor";
import Login from "./routes/Login";
import Annex from "./routes/Annex";
import Items from "./components/Items";
import Accounts from "./routes/Accounts";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}
render(
  () => (
    <Router>
      <Route path="/" component={App} />
      <Route path="/scan" component={ActiveScan} />
      <Route path="/reports" component={ViewReports} />
      <Route path="/admin" component={Admin} />
      <Route path="/monitor" component={Monitor} />
      <Route path="/login" component={Login} />
      <Route path="/annex" component={Annex} />
      <Route path="/annex/items" component={Items} />
      <Route path="/annex/accounts" component={Accounts} />
    </Router>
  ),
  document.getElementById("root")!,
);
