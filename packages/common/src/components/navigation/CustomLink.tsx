import { createLink, type LinkComponent } from "@tanstack/react-router"
import { Anchor, type AnchorProps } from "@mantine/core"

/** Props for Mantine Anchor integration */
interface MantineLinkProps extends Omit<AnchorProps, "href"> {
  ref?: React.Ref<HTMLAnchorElement>
}

/** Mantine Anchor wrapper for TanStack Router */
const MantineLinkComponent = (props: MantineLinkProps) => {
  return <Anchor {...props} />
}

/** TanStack Router link with Mantine Anchor */
const CreatedLinkComponent = createLink(MantineLinkComponent)

/** Type-safe link component with Mantine styling */
export const CustomLink: LinkComponent<typeof MantineLinkComponent> = (props) => {
  return <CreatedLinkComponent preload="intent" underline="never" c="inherit" {...props} />
}
