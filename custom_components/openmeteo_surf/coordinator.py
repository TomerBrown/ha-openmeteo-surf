"""DataUpdateCoordinator for Open-Meteo Surf."""
from __future__ import annotations

from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

from .api import OpenMeteoSurfApiClient, OpenMeteoSurfApiClientError
from .const import CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL, DOMAIN, LOGGER

class OpenMeteoSurfDataUpdateCoordinator(DataUpdateCoordinator):
    """Class to manage fetching Open-Meteo Surf data."""

    config_entry: ConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        client: OpenMeteoSurfApiClient,
    ) -> None:
        """Initialize the coordinator."""
        self.client = client
        super().__init__(
            hass,
            LOGGER,
            name=DOMAIN,
            update_interval=timedelta(
                minutes=hass.config_entries.async_get_entry(
                    self.config_entry.entry_id
                ).options.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)
                if hasattr(self, "config_entry")
                else DEFAULT_UPDATE_INTERVAL
            ),
        )

    async def _async_update_data(self):
        """Fetch data from Open-Meteo Surf API."""
        try:
            return await self.client.async_get_data()
        except OpenMeteoSurfApiClientError as error:
            raise UpdateFailed(f"Invalid response from API: {error}") from error
