import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router"
import Home from "@/components/pages/Home"
import Login from "@/components/pages/Login"

const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/login", Component: Login },
])

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}

export default App
