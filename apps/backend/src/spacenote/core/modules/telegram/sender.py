import telegram


async def send_message(token: str, chat_id: str, text: str, parse_mode: str = "HTML") -> int:
    """Send message to Telegram, return message_id."""
    bot = telegram.Bot(token=token)
    message = await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
    return message.message_id


async def edit_message_text(token: str, chat_id: str, message_id: int, text: str, parse_mode: str = "HTML") -> None:
    """Edit existing Telegram message text."""
    bot = telegram.Bot(token=token)
    await bot.edit_message_text(chat_id=chat_id, message_id=message_id, text=text, parse_mode=parse_mode)
