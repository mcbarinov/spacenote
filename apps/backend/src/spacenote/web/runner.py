"""Uvicorn server runner."""

import uvicorn

from spacenote.app import App
from spacenote.config import Config
from spacenote.web.server import create_fastapi_app


def run_server(app: App, config: Config) -> None:
    """Run the Uvicorn server."""
    fastapi_app = create_fastapi_app(app, config)

    uvicorn.run(fastapi_app, host=config.host, port=config.port, log_config=None, access_log=True)
