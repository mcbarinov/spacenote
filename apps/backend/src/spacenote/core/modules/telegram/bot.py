from pathlib import Path

import telegram
from telegram import InputMediaPhoto, Message


async def send_message(bot: telegram.Bot, chat_id: str, text: str) -> Message:
    """Send message, return Message object."""
    return await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")


async def edit_message(bot: telegram.Bot, chat_id: str, message_id: int, text: str) -> Message | bool:
    """Edit message text, return Message object or True if unchanged."""
    return await bot.edit_message_text(chat_id=chat_id, message_id=message_id, text=text, parse_mode="HTML")


async def send_photo(bot: telegram.Bot, chat_id: str, photo_path: Path, caption: str) -> Message:
    """Send photo, return Message object."""
    with photo_path.open("rb") as photo_file:
        return await bot.send_photo(chat_id=chat_id, photo=photo_file, caption=caption, parse_mode="HTML")


async def edit_photo(bot: telegram.Bot, chat_id: str, message_id: int, photo_path: Path, caption: str) -> Message | bool:
    """Edit photo message, return Message object or True if unchanged."""
    with photo_path.open("rb") as photo_file:
        media = InputMediaPhoto(media=photo_file, caption=caption, parse_mode="HTML")
        return await bot.edit_message_media(chat_id=chat_id, message_id=message_id, media=media)
