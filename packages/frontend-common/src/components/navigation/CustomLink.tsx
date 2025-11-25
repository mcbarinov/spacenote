import { createLink, type LinkComponent } from "@tanstack/react-router"
import { Anchor, type AnchorProps } from "@mantine/core"

interface MantineLinkProps extends Omit<AnchorProps, "href"> {
  ref?: React.Ref<HTMLAnchorElement>
}

const MantineLinkComponent = (props: MantineLinkProps) => {
  return <Anchor {...props} />
}

const CreatedLinkComponent = createLink(MantineLinkComponent)

export const CustomLink: LinkComponent<typeof MantineLinkComponent> = (props) => {
  return <CreatedLinkComponent preload="intent" underline="never" c="inherit" {...props} />
}
