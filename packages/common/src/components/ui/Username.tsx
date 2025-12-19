/** Displays username with user icon */
export function Username({ username }: { username: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.25em", alignItems: "center" }}>
      <span aria-hidden="true">👤</span>
      <span>{username}</span>
    </span>
  )
}
