import os
from importlib import reload


def test_settings_defaults(monkeypatch):
    # Clear env and reload settings
    for k in [
        "ENV",
        "PORT",
        "LOG_LEVEL",
        "ZOOM_API_KEY",
        "ZOOM_API_SECRET",
        "ZOOM_ACCOUNT_ID",
    ]:
        monkeypatch.delenv(k, raising=False)
    from edtech_service.config import settings as settings_module
    reload(settings_module)
    assert settings_module.settings.PORT == 8000
    assert settings_module.settings.ENV == "development"


def test_settings_env_override(monkeypatch):
    monkeypatch.setenv("PORT", "9001")
    monkeypatch.setenv("ENV", "test")
    from edtech_service.config import settings as settings_module
    reload(settings_module)
    assert settings_module.settings.PORT == 9001
    assert settings_module.settings.ENV == "test"
