import { Alert, Badge, Button, Code, Group, List, Paper, Stack, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { zod4Resolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import { z } from "zod"
import { api } from "@/api"
import { ErrorMessage } from "@/components/ErrorMessage"
import type { Space, TelegramTestResult } from "@/types"

interface EditTelegramProps {
  space: Space
}

const channelSchema = z.object({ channel: z.string() })

/** Telegram settings split into two independent sections (see B004 in docs/behavior.md):
 * - Activity channel: free-form, can be changed/cleared at any time.
 * - Mirror channel: state machine. Enable triggers backfill; once enabled, the channel cannot be edited.
 *   Disable wipes mirror DB state for the space (Telegram channel itself is untouched). */
export function EditTelegram({ space }: EditTelegramProps) {
  return (
    <Stack gap="md">
      <ActivityChannel space={space} />
      <MirrorChannel space={space} />
    </Stack>
  )
}

/** Opens a modal with the connectivity test result. Success: shows bot username, chat title, and test message id
 *  with a reminder to delete it manually. Failure: surfaces the failed API method, exception class, and Telegram
 *  description, plus targeted hints for the most common causes. */
function openTestResultModal(result: TelegramTestResult): void {
  if (result.success) {
    modals.open({
      title: <Text fw={600}>Telegram connectivity OK</Text>,
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Bot <Code>@{result.bot_username}</Code> posted to <Code>{result.chat_title ?? result.chat_id}</Code>.
          </Text>
          <Text size="sm">
            Test message id: <Code>{result.message_id}</Code>
          </Text>
          <Alert color="yellow" variant="light">
            The test message was NOT auto-deleted. Open the channel in Telegram and delete it manually.
          </Alert>
        </Stack>
      ),
    })
    return
  }
  modals.open({
    title: (
      <Text fw={600} c="red">
        Telegram connectivity failed
      </Text>
    ),
    children: (
      <Stack gap="sm">
        <Text size="sm">
          API call <Code>{result.method}</Code> failed: <Code>{result.error_class}</Code>
        </Text>
        <Code block>{result.error}</Code>
        <Text size="sm" c="dimmed">
          Bot tested: <Code>@{result.bot_username ?? "unknown"}</Code> / chat: <Code>{result.chat_id}</Code>
        </Text>
        <Alert color="orange" variant="light" title="Common causes">
          <List size="sm" spacing={2}>
            <List.Item>
              Bot <Code>@{result.bot_username ?? "?"}</Code> is not an admin of the channel — add it with Post Messages
              permission.
            </List.Item>
            <List.Item>
              Channel id is wrong — for private channels it must start with <Code>-100</Code>.
            </List.Item>
            <List.Item>SPACENOTE_TELEGRAM_BOT_TOKEN points to a different bot than the one added to the channel.</List.Item>
          </List>
        </Alert>
      </Stack>
    ),
  })
}

interface TestChannelButtonProps {
  slug: string
  channel: string
}

/** Test button — disabled when channel is empty. On click, calls the probe and opens the result modal. */
function TestChannelButton({ slug, channel }: TestChannelButtonProps) {
  const mutation = api.mutations.useTestTelegramChannel(slug)
  const handleClick = () => {
    mutation.mutate(
      { channel },
      {
        onSuccess: (result) => {
          openTestResultModal(result)
        },
        onError: (error) => {
          notifications.show({
            color: "red",
            title: "Test failed",
            message: error instanceof Error ? error.message : "Unknown error",
          })
        },
      }
    )
  }
  return (
    <Button variant="default" onClick={handleClick} loading={mutation.isPending} disabled={!channel}>
      Test
    </Button>
  )
}

function ActivityChannel({ space }: EditTelegramProps) {
  const mutation = api.mutations.useSetActivityChannel(space.slug)
  const form = useForm({
    initialValues: { channel: space.telegram?.activity_channel ?? "" },
    validate: zod4Resolver(channelSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(
      { channel: values.channel || null },
      {
        onSuccess: () => {
          notifications.show({ message: "Activity channel updated", color: "green" })
        },
      }
    )
  })

  return (
    <Paper withBorder p="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Activity Channel</Title>
          <TextInput
            label="Channel"
            description="Channel for activity notifications (e.g. @mychannel or -1001234567890). Leave empty to disable."
            placeholder="@channel or chat ID"
            {...form.getInputProps("channel")}
          />
          {mutation.error && <ErrorMessage error={mutation.error} />}
          <Group justify="flex-end">
            <TestChannelButton slug={space.slug} channel={form.values.channel} />
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

function MirrorChannel({ space }: EditTelegramProps) {
  const isEnabled = !!space.telegram?.mirror_channel
  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Mirror Channel</Title>
          {isEnabled && <Badge color="green">Enabled</Badge>}
        </Group>
        {isEnabled ? <MirrorEnabled space={space} /> : <MirrorDisabled space={space} />}
      </Stack>
    </Paper>
  )
}

function MirrorDisabled({ space }: EditTelegramProps) {
  const mutation = api.mutations.useEnableMirror(space.slug)
  const form = useForm({
    initialValues: { channel: "" },
    validate: zod4Resolver(channelSchema.refine((v) => v.channel.length > 0, { message: "Channel is required" })),
  })

  const enable = (channel: string) => {
    mutation.mutate(
      { channel },
      {
        onSuccess: () => {
          notifications.show({
            message: "Mirror enabled. Existing notes will be posted in order.",
            color: "green",
          })
        },
      }
    )
  }

  const handleSubmit = form.onSubmit((values) => {
    modals.openConfirmModal({
      title: "Enable Mirror",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            A Telegram post will be created for every existing note in this space, in number order. The channel will then be
            locked to <Code>{values.channel}</Code>.
          </Text>
          <Text size="sm">
            To switch channels later, you must first disable mirroring — which permanently removes all mirror references from the
            database.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Enable", cancel: "Cancel" },
      onConfirm: () => {
        enable(values.channel)
      },
    })
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Channel"
          description="Channel for mirroring all notes (@channel or -1001234567890). Once enabled, the channel cannot be changed without disabling first."
          placeholder="@channel or chat ID"
          {...form.getInputProps("channel")}
        />
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <Group justify="flex-end">
          <TestChannelButton slug={space.slug} channel={form.values.channel} />
          <Button type="submit" loading={mutation.isPending}>
            Enable Mirror
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

function MirrorEnabled({ space }: EditTelegramProps) {
  const channel = space.telegram?.mirror_channel ?? ""

  const openDisableConfirm = () => {
    const modalId = modals.open({
      title: (
        <Text fw={600} c="red">
          Disable Mirror
        </Text>
      ),
      size: "md",
      children: (
        <DisableMirrorConfirm
          slug={space.slug}
          channel={channel}
          onClose={() => {
            modals.close(modalId)
          }}
        />
      ),
    })
  }

  return (
    <Stack gap="md">
      <TextInput label="Channel" value={channel} readOnly />
      <Text size="sm" c="dimmed">
        To change the channel: first disable mirroring, then enable on the new channel. Disabling removes all mirror references
        from the database — Telegram posts in the channel itself are not deleted.
      </Text>
      <Group justify="flex-end">
        <TestChannelButton slug={space.slug} channel={channel} />
        <Button color="red" onClick={openDisableConfirm}>
          Disable Mirror
        </Button>
      </Group>
    </Stack>
  )
}

interface DisableMirrorConfirmProps {
  slug: string
  channel: string
  onClose: () => void
}

/** Owns the disable mutation so the modal re-renders on isPending/error changes.
 *  Mantine's imperative modals.open() captures children once — passing mutation state
 *  as props from outside would freeze loading/error at open time. */
function DisableMirrorConfirm({ slug, channel, onClose }: DisableMirrorConfirmProps) {
  const mutation = api.mutations.useDisableMirror(slug)
  const [typed, setTyped] = useState("")
  const matches = typed === channel

  const handleConfirm = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        onClose()
        notifications.show({ message: "Mirror disabled", color: "green" })
      },
    })
  }

  return (
    <Stack gap="md">
      <Alert color="red" variant="light" title="This action cannot be undone">
        <List size="sm" spacing={4}>
          <List.Item>All mirror references for this space will be permanently removed from the database.</List.Item>
          <List.Item>Any pending mirror tasks for this space will be deleted from the queue.</List.Item>
          <List.Item>
            Telegram posts in <Code>{channel}</Code> will <strong>not</strong> be deleted — they remain in the channel as orphans.
          </List.Item>
          <List.Item>If you want to remove those posts, do it in Telegram before disabling here.</List.Item>
          <List.Item>
            Re-enabling later (even on the same channel) creates fresh posts; old posts will not be linked back.
          </List.Item>
        </List>
      </Alert>
      <TextInput
        label={
          <Text size="sm">
            To confirm, type <Code>{channel}</Code> below
          </Text>
        }
        value={typed}
        onChange={(e) => {
          setTyped(e.currentTarget.value)
        }}
        placeholder={channel}
        autoFocus
        error={typed.length > 0 && !matches ? "Does not match" : null}
      />
      {mutation.error && <ErrorMessage error={mutation.error} />}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button color="red" disabled={!matches} loading={mutation.isPending} onClick={handleConfirm}>
          Disable Mirror
        </Button>
      </Group>
    </Stack>
  )
}
