import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl">Page not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/forums">
            <Button>Go to Forums</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
