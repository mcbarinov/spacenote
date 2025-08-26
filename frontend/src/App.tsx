import React from "react"
import { RouterProvider } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { router } from "./router"

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </React.StrictMode>
  )
}

export default App
