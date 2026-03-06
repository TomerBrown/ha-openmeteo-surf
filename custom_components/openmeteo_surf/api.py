"""Open-Meteo Surf API Client."""
from __future__ import annotations

import asyncio
import socket
from typing import Any

import aiohttp
import async_timeout

from .const import FORECAST_API_URL, LOGGER, MARINE_API_URL

class OpenMeteoSurfApiClientError(Exception):
    """Exception to indicate a general API error."""

class OpenMeteoSurfApiClientCommunicationError(OpenMeteoSurfApiClientError):
    """Exception to indicate a communication error."""

class OpenMeteoSurfApiClientAuthenticationError(OpenMeteoSurfApiClientError):
    """Exception to indicate an authentication error (though not used currently)."""

class OpenMeteoSurfApiClient:
    """Open-Meteo Surf API Client."""

    def __init__(
        self,
        latitude: float,
        longitude: float,
        session: aiohttp.ClientSession,
        timezone: str = "auto",
    ) -> None:
        """Initialize the API client."""
        self._latitude = latitude
        self._longitude = longitude
        self._session = session
        self._timezone = timezone

    async def async_get_data(self) -> dict:
        """Get current + forecast data from the API."""
        # Fetch data from both APIs concurrently
        marine_data, forecast_data = await asyncio.gather(
            self._fetch_marine_data(),
            self._fetch_forecast_data(),
        )
        
        # Consolidate results
        return {
            "current": self._process_current_data(marine_data, forecast_data),
            "hourly": self._process_hourly_data(marine_data, forecast_data),
            "daily": self._process_daily_data(marine_data, forecast_data),
        }

    async def _fetch_marine_data(self) -> dict:
        """Fetch marine weather data."""
        params = {
            "latitude": self._latitude,
            "longitude": self._longitude,
            "current": "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature",
            "hourly": "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature",
            "daily": "wave_height_max,wave_period_max,wave_direction_dominant,swell_wave_height_max,swell_wave_period_max",
            "timezone": self._timezone,
        }
        return await self._api_wrapper(MARINE_API_URL, params)

    async def _fetch_forecast_data(self) -> dict:
        """Fetch atmospheric forecast data."""
        params = {
            "latitude": self._latitude,
            "longitude": self._longitude,
            "current": "temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code",
            "hourly": "temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,weather_code",
            "timezone": self._timezone,
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
        }
        return await self._api_wrapper(FORECAST_API_URL, params)

    async def _api_wrapper(self, url: str, params: dict) -> dict:
        """Execute the API call."""
        LOGGER.debug("Requesting %s with params %s", url, params)
        try:
            async with async_timeout.timeout(10):
                response = await self._session.get(url, params=params)
                if response.status in [401, 403]:
                    LOGGER.error("Authentication error on %s", url)
                    raise OpenMeteoSurfApiClientAuthenticationError(
                        "Authentication error"
                    )
                if not response.ok:
                    text = await response.text()
                    LOGGER.error("API returned status %s for %s with message: %s", response.status, url, text)
                response.raise_for_status()
                data = await response.json()
                LOGGER.debug("API Response from %s: %s", url, data)
                return data

        except asyncio.TimeoutError as exception:
            LOGGER.error("Timeout connecting to Open-Meteo %s", url)
            raise OpenMeteoSurfApiClientCommunicationError(
                "Timeout error fetching information",
            ) from exception
        except (aiohttp.ClientError, socket.gaierror) as exception:
            LOGGER.error("Network error connecting to Open-Meteo %s: %s", url, exception)
            raise OpenMeteoSurfApiClientCommunicationError(
                "Error fetching information",
            ) from exception
        except Exception as exception:  # pylint: disable=broad-except
            LOGGER.exception("Unexpected API error on %s: %s", url, exception)
            raise OpenMeteoSurfApiClientError(
                "Something really wrong happened!"
            ) from exception

    def _process_current_data(self, marine_data: dict, forecast_data: dict) -> dict:
        """Process and consolidate current data."""
        result = {}

        if "current" in marine_data:
            result.update(marine_data["current"])

        if "current" in forecast_data:
            result.update(forecast_data["current"])

        return result

    def _process_hourly_data(self, marine_data: dict, forecast_data: dict) -> list[dict]:
        """Merge marine and atmospheric hourly forecast into a list of dicts."""
        hourly: list[dict] = []
        
        marine_hourly = marine_data.get("hourly", {})
        atmo_hourly = forecast_data.get("hourly", {})
        
        # Use time from whichever source has it
        times = marine_hourly.get("time", []) or atmo_hourly.get("time", [])
        
        for i, time_str in enumerate(times):
            entry: dict = {"datetime": time_str}
            # Marine fields
            for key in ("wave_height", "wave_period", "wave_direction",
                        "swell_wave_height", "swell_wave_period", "swell_wave_direction",
                        "sea_surface_temperature"):
                values = marine_hourly.get(key, [])
                if i < len(values):
                    entry[key] = values[i]
            # Atmospheric fields
            for key in ("temperature_2m", "precipitation", "wind_speed_10m",
                        "wind_direction_10m", "wind_gusts_10m", "weather_code"):
                values = atmo_hourly.get(key, [])
                if i < len(values):
                    entry[key] = values[i]
            hourly.append(entry)
        
        return hourly

    def _process_daily_data(self, marine_data: dict, forecast_data: dict) -> list[dict]:
        """Merge marine and atmospheric daily forecast into a list of dicts."""
        daily: list[dict] = []
        
        marine_daily = marine_data.get("daily", {})
        atmo_daily = forecast_data.get("daily", {})
        
        times = marine_daily.get("time", []) or atmo_daily.get("time", [])
        
        for i, time_str in enumerate(times):
            entry: dict = {"datetime": time_str}
            # Marine daily fields
            for key in ("wave_height_max", "wave_period_max", "wave_direction_dominant",
                        "swell_wave_height_max", "swell_wave_period_max"):
                values = marine_daily.get(key, [])
                if i < len(values):
                    entry[key] = values[i]
            # Atmospheric daily fields
            for key in ("temperature_2m_max", "temperature_2m_min", "precipitation_sum",
                        "wind_speed_10m_max", "wind_gusts_10m_max", "weather_code"):
                values = atmo_daily.get(key, [])
                if i < len(values):
                    entry[key] = values[i]
            daily.append(entry)
        
        return daily
