import { useParams } from "react-router"

export default function SpaceSettings() {
  const { slug } = useParams()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <p className="text-muted-foreground">Space: {slug}</p>
      <div className="mt-8 p-8 border rounded-lg bg-muted/10 text-center">
        <p className="text-muted-foreground">Space settings coming soon</p>
      </div>
    </div>
  )
}