"""Button platform for Open-Meteo Surf."""
from __future__ import annotations

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import CONF_NAME, DOMAIN
from .coordinator import OpenMeteoSurfDataUpdateCoordinator

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the button platform."""
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([OpenMeteoSurfRefreshButton(coordinator, entry)])

class OpenMeteoSurfRefreshButton(ButtonEntity):
    """Representation of an Open-Meteo Surf refresh button."""

    def __init__(
        self,
        coordinator: OpenMeteoSurfDataUpdateCoordinator,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the button."""
        self.coordinator = coordinator
        self._attr_name = f"{entry.data.get(CONF_NAME, 'Surf Spot')} Refresh"
        self._attr_unique_id = f"{entry.entry_id}_refresh"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.data.get(CONF_NAME, "Surf Spot"),
            manufacturer="Open-Meteo",
            entry_type="service",
        )
        self._attr_icon = "mdi:refresh"

    async def async_press(self) -> None:
        """Handle the button press."""
        await self.coordinator.async_request_refresh()
