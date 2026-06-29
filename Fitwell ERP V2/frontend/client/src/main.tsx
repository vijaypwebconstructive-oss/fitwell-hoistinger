import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
// import { createRoot } from "react-dom/client";

// console.log("ENV:", import.meta.env);
// console.log("API:", import.meta.env.VITE_API_URL);

// createRoot(document.getElementById("root")!).render(<h1>Hello</h1>);
