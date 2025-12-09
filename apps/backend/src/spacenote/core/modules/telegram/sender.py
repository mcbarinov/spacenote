import telegram


async def send_message(token: str, chat_id: str, text: str, parse_mode: str = "HTML") -> int:
    """Send message to Telegram, return message_id."""
    bot = telegram.Bot(token=token)
    message = await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
    return message.message_id
