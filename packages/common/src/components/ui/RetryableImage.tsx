import { Image, Skeleton, Stack, Text, type ImageProps } from "@mantine/core"
import { useImageWithRetry } from "../../hooks/useImageWithRetry"

interface RetryableImageProps extends Omit<ImageProps, "src"> {
  /** Image URL */
  src: string
  /** Skeleton height (default: 200) */
  skeletonHeight?: number
}

/** Image with automatic retry for processing images (202 responses) */
export function RetryableImage({ src, skeletonHeight = 200, radius, ...imageProps }: RetryableImageProps) {
  const { src: imageSrc, isLoading, isError, retry } = useImageWithRetry(src)

  if (isLoading) {
    return <Skeleton height={skeletonHeight} radius={radius ?? "sm"} />
  }

  if (isError) {
    return (
      <Stack align="center" justify="center" h={skeletonHeight} bg="gray.1" style={{ borderRadius: "var(--mantine-radius-sm)" }}>
        <Text size="sm" c="dimmed">
          Failed to load image
        </Text>
        <Text size="xs" c="blue" style={{ cursor: "pointer" }} onClick={retry}>
          Retry
        </Text>
      </Stack>
    )
  }

  return <Image src={imageSrc} radius={radius} {...imageProps} />
}
