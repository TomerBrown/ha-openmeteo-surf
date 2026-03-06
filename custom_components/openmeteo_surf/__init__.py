"""Initial setup of the Open-Meteo Surf integration."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import OpenMeteoSurfApiClient
from .const import CONF_LATITUDE, CONF_LONGITUDE, DOMAIN
from .coordinator import OpenMeteoSurfDataUpdateCoordinator

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BUTTON, Platform.WEATHER]

CARD_URL = "/openmeteo_surf/openmeteo-surf-card.js"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Open-Meteo Surf from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # Register the custom Lovelace card frontend resource
    await _register_card(hass)
    
    client = OpenMeteoSurfApiClient(
        latitude=entry.data[CONF_LATITUDE],
        longitude=entry.data[CONF_LONGITUDE],
        session=async_get_clientsession(hass),
    )
    
    coordinator = OpenMeteoSurfDataUpdateCoordinator(hass, client)
    coordinator.config_entry = entry
    
    await coordinator.async_config_entry_first_refresh()
    
    hass.data[DOMAIN][entry.entry_id] = coordinator
    
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    
    return True


async def _register_card(hass: HomeAssistant) -> None:
    """Register the custom Lovelace card as a static resource."""
    # Only register once
    if DOMAIN in hass.data and "__card_registered" in hass.data.get(DOMAIN, {}):
        return
    
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                CARD_URL,
                str(Path(__file__).parent / "www" / "openmeteo-surf-card.js"),
                False,
            )
        ]
    )
    
    # Register as a Lovelace resource
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["__card_registered"] = True
    
    # Add the resource via the lovelace resources collection
    hass.components.frontend.async_register_built_in_panel(
        "lovelace", require_admin=False
    ) if False else None  # panel already registered
    
    from homeassistant.components.lovelace.resources import (
        ResourceStorageCollection,
    )
    
    async def _register_resource() -> None:
        """Register the card resource if not already present."""
        try:
            resources = hass.data.get("lovelace_resources")
            if resources and isinstance(resources, ResourceStorageCollection):
                # Check if already registered
                for item in resources.async_items():
                    if item.get("url") == CARD_URL:
                        return
                await resources.async_create_item(
                    {"res_type": "module", "url": CARD_URL}
                )
        except Exception:  # pylint: disable=broad-except
            pass  # Resource registration is best-effort
    
    hass.async_create_task(_register_resource())


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)
        
    return unload_ok
