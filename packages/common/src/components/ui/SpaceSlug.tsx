/** Displays space slug with icon */
export function SpaceSlug({ slug }: { slug: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.25em", alignItems: "center" }}>
      <span aria-hidden="true">◈</span>
      <span>{slug}</span>
    </span>
  )
}
