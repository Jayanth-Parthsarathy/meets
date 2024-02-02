/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "./index.css";
import App from "./App";
import Room from "./routes/room";
import Register from "./routes/register";
import Login from "./routes/login";

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
      <Route path="/:id" component={Room} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
    </Router>
  ),
  root!,
);
