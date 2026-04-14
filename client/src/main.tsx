import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserApp } from "./BrowserApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserApp />
  </React.StrictMode>
);
