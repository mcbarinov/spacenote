import { useParams } from "react-router"
import { TitleSettingsForm } from "./-components/TitleSettingsForm"
import { ListFieldsSettingsForm } from "./-components/ListFieldsSettingsForm"
import { HiddenFieldsSettingsForm } from "./-components/HiddenFieldsSettingsForm"
import { useSpace } from "@/hooks/useSpace"

export default function SpaceSettings() {
  const { slug } = useParams() as { slug: string }
  const space = useSpace(slug)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Space Settings</h1>

      <div className="space-y-6">
        <TitleSettingsForm space={space} />
        <ListFieldsSettingsForm space={space} />
        <HiddenFieldsSettingsForm space={space} />
      </div>
    </div>
  )
}
