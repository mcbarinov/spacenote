import { createLink, type LinkComponent } from "@tanstack/react-router"
import { Button, type ButtonProps } from "@mantine/core"

/** Props for button link integration */
interface LinkButtonProps extends Omit<ButtonProps, "component"> {
  ref?: React.Ref<HTMLAnchorElement>
}

/** Mantine Button wrapper for TanStack Router */
const MantineButtonLink = (props: LinkButtonProps) => <Button component="a" {...props} />

/** TanStack Router link with Mantine Button */
const CreatedLinkButton = createLink(MantineButtonLink)

/** Type-safe button link component */
export const LinkButton: LinkComponent<typeof MantineButtonLink> = (props) => <CreatedLinkButton preload="intent" {...props} />
