import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { appRoutes } from "../routes";
import "../styles/global.css";

const router = createBrowserRouter(appRoutes);

createRoot(document.getElementById("root") as HTMLElement).render(<RouterProvider router={router} />);
