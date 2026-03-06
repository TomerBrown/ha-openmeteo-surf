"""Config flow for Open-Meteo Surf integration."""
from __future__ import annotations

from typing import Any
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import homeassistant.helpers.config_validation as cv

from .api import (
    OpenMeteoSurfApiClient,
    OpenMeteoSurfApiClientCommunicationError,
    OpenMeteoSurfApiClientError,
)
from .const import (
    CONF_LATITUDE,
    CONF_LONGITUDE,
    CONF_NAME,
    CONF_TIMEZONE,
    CONF_UPDATE_INTERVAL,
    DEFAULT_UPDATE_INTERVAL,
    DOMAIN,
    LOGGER,
    UPDATE_INTERVAL_OPTIONS,
)

class OpenMeteoSurfConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Open-Meteo Surf."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> OpenMeteoSurfOptionsFlowHandler:
        """Get the options flow for this handler."""
        return OpenMeteoSurfOptionsFlowHandler(config_entry)

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.FlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        location_data = None
        if user_input is not None:
            # Handle new selector format
            if "location" in user_input and isinstance(user_input["location"], dict):
                location_data = {
                    CONF_LATITUDE: float(user_input["location"].get("latitude", user_input.get(CONF_LATITUDE))),
                    CONF_LONGITUDE: float(user_input["location"].get("longitude", user_input.get(CONF_LONGITUDE))),
                }
            # Handle legacy format or fallback
            elif CONF_LATITUDE in user_input and CONF_LONGITUDE in user_input:
                location_data = {
                    CONF_LATITUDE: float(user_input[CONF_LATITUDE]),
                    CONF_LONGITUDE: float(user_input[CONF_LONGITUDE]),
                }
            else:
                LOGGER.warning("Could not parse location from user input: %s", user_input)

            if location_data:
                try:
                    await self._test_credentials(
                        latitude=location_data[CONF_LATITUDE],
                        longitude=location_data[CONF_LONGITUDE],
                    )
                except OpenMeteoSurfApiClientCommunicationError as comm_ex:
                    LOGGER.error("Communication error while testing API: %s", comm_ex)
                    errors["base"] = "cannot_connect"
                except OpenMeteoSurfApiClientError as api_ex:
                    LOGGER.error("API error while testing credentials: %s", api_ex)
                    errors["base"] = "unknown"
                except Exception as ex:  # pylint: disable=broad-except
                    LOGGER.exception("Unexpected exception during setup: %s", ex)
                    errors["base"] = "unknown"
                else:
                    return self.async_create_entry(
                        title=user_input.get(CONF_NAME, "Open-Meteo Surf"),
                        data={
                            CONF_NAME: user_input.get(CONF_NAME, "Open-Meteo Surf"),
                            CONF_LATITUDE: location_data[CONF_LATITUDE],
                            CONF_LONGITUDE: location_data[CONF_LONGITUDE],
                            CONF_TIMEZONE: user_input.get(CONF_TIMEZONE, self.hass.config.time_zone),
                        },
                    )
            else:
                errors["base"] = "invalid_location"

        schema = vol.Schema({
            vol.Required(CONF_NAME, default="Open-Meteo Surf"): str,
        })
        
        # In Home Assistant 2023.x+ we can use selector.LocationSelector
        from homeassistant.helpers import selector
        schema = schema.extend({
            vol.Required(
                "location", 
                default={
                    "latitude": self.hass.config.latitude, 
                    "longitude": self.hass.config.longitude, 
                    "radius": 0
                }
            ): selector.LocationSelector(
                selector.LocationSelectorConfig(radius=False)
            ),
            vol.Required(
                CONF_TIMEZONE, default=self.hass.config.time_zone
            ): selector.TextSelector(),
        })

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    async def _test_credentials(self, latitude: float, longitude: float) -> None:
        """Validate credentials."""
        client = OpenMeteoSurfApiClient(
            latitude=latitude,
            longitude=longitude,
            session=async_get_clientsession(self.hass),
        )
        await client.async_get_data()

class OpenMeteoSurfOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Open-Meteo Surf options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_UPDATE_INTERVAL,
                        default=self.config_entry.options.get(
                            CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL
                        ),
                    ): vol.In(UPDATE_INTERVAL_OPTIONS),
                }
            ),
        )
