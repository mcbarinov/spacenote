import { createLink, type LinkComponent } from "@tanstack/react-router"
import { Button, type ButtonProps } from "@mantine/core"

interface LinkButtonProps extends Omit<ButtonProps, "component"> {
  ref?: React.Ref<HTMLAnchorElement>
}

const MantineButtonLink = (props: LinkButtonProps) => {
  return <Button component="a" {...props} />
}

const CreatedLinkButton = createLink(MantineButtonLink)

export const LinkButton: LinkComponent<typeof MantineButtonLink> = (props) => {
  return <CreatedLinkButton preload="intent" {...props} />
}
