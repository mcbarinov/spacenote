from pathlib import Path

import telegram
from telegram import InputMediaPhoto


async def send_message(bot: telegram.Bot, chat_id: str, text: str) -> int:
    """Send message, return message_id."""
    message = await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
    return message.message_id


async def edit_message(bot: telegram.Bot, chat_id: str, message_id: int, text: str) -> None:
    """Edit message text."""
    await bot.edit_message_text(chat_id=chat_id, message_id=message_id, text=text, parse_mode="HTML")


async def send_photo(bot: telegram.Bot, chat_id: str, photo_path: Path, caption: str) -> int:
    """Send photo, return message_id."""
    with photo_path.open("rb") as photo_file:
        message = await bot.send_photo(chat_id=chat_id, photo=photo_file, caption=caption, parse_mode="HTML")
    return message.message_id


async def edit_photo(bot: telegram.Bot, chat_id: str, message_id: int, photo_path: Path, caption: str) -> None:
    """Edit photo message."""
    with photo_path.open("rb") as photo_file:
        media = InputMediaPhoto(media=photo_file, caption=caption, parse_mode="HTML")
        await bot.edit_message_media(chat_id=chat_id, message_id=message_id, media=media)
