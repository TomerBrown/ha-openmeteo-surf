"""Initial setup of the Open-Meteo Surf integration."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import OpenMeteoSurfApiClient
from .const import CONF_LATITUDE, CONF_LONGITUDE, CONF_TIMEZONE, DOMAIN
from .coordinator import OpenMeteoSurfDataUpdateCoordinator

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BUTTON, Platform.WEATHER]

CARD_URL = "/openmeteo_surf/openmeteo-surf-card.js"
URL_BASE = "/openmeteo_surf"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Open-Meteo Surf from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # Register the custom Lovelace card frontend resource
    await _register_card(hass)
    
    client = OpenMeteoSurfApiClient(
        latitude=entry.data[CONF_LATITUDE],
        longitude=entry.data[CONF_LONGITUDE],
        session=async_get_clientsession(hass),
        timezone=entry.data.get(CONF_TIMEZONE, "auto"),
    )
    
    coordinator = OpenMeteoSurfDataUpdateCoordinator(hass, client)
    coordinator.config_entry = entry
    
    await coordinator.async_config_entry_first_refresh()
    
    hass.data[DOMAIN][entry.entry_id] = coordinator
    
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    
    return True


async def _register_card(hass: HomeAssistant) -> None:
    """Register the custom Lovelace card and icons as a static resource."""
    # Only register once per session
    if hass.data.get(DOMAIN, {}).get("__card_registered"):
        return

    # 1. Register the static path for the entire www folder
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                URL_BASE,
                str(Path(__file__).parent / "www"),
                False,
            )
        ]
    )

    # 2. Register as a Lovelace resource if in storage mode
    async def _async_register_lovelace_resource() -> None:
        """Register the card resource if not already present."""
        from homeassistant.components.lovelace import DOMAIN as LOVELACE_DOMAIN
        
        lovelace = hass.data.get(LOVELACE_DOMAIN)
        if not lovelace or not hasattr(lovelace, "resources"):
            return

        resources = lovelace.resources
        if not resources:
            return

        if not resources.loaded:
            await resources.async_load()

        # Check if already registered (any version of this card)
        if any(item.get("url").startswith(CARD_URL) for item in resources.async_items()):
            return

        # Add the resource with a version string to bust cache
        await resources.async_create_item(
            {"res_type": "module", "url": f"{CARD_URL}?v=1.0.1"}
        )

    # Use a task to not block setup
    hass.async_create_task(_async_register_lovelace_resource())
    
    hass.data.setdefault(DOMAIN, {})["__card_registered"] = True


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)
        
    return unload_ok
