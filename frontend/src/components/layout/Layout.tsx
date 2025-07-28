import { useEffect } from "react"
import { Outlet } from "react-router"
import Footer from "./Footer"
import Header from "./Header"
import { loadSpaces } from "@/services/spaceService"
import { DialogProvider } from "@/lib/dialog"
import { Toaster } from "@/components/ui/sonner"

export default function Layout() {
  useEffect(() => {
    loadSpaces()
  }, [])

  return (
    <DialogProvider>
      <div className="min-h-screen flex flex-col 	max-w-screen-xl mx-auto">
        <Header />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </DialogProvider>
  )
}
