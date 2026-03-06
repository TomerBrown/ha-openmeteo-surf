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
    ) -> None:
        """Initialize the API client."""
        self._latitude = latitude
        self._longitude = longitude
        self._session = session

    async def async_get_data(self) -> dict:
        """Get data from the API."""
        # Fetch data from both APIs concurrently
        marine_data, forecast_data = await asyncio.gather(
            self._fetch_marine_data(),
            self._fetch_forecast_data()
        )
        
        # Merge the hourly data for the current time
        return self._process_data(marine_data, forecast_data)

    async def _fetch_marine_data(self) -> dict:
        """Fetch marine weather data."""
        params = {
            "latitude": self._latitude,
            "longitude": self._longitude,
            "hourly": "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature,sea_level_height",
        }
        return await self._api_wrapper(MARINE_API_URL, params)

    async def _fetch_forecast_data(self) -> dict:
        """Fetch atmospheric forecast data."""
        params = {
            "latitude": self._latitude,
            "longitude": self._longitude,
            "hourly": "temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        }
        return await self._api_wrapper(FORECAST_API_URL, params)

    async def _api_wrapper(self, url: str, params: dict) -> dict:
        """Execute the API call."""
        try:
            async with async_timeout.timeout(10):
                response = await self._session.get(url, params=params)
                if response.status in [401, 403]:
                    raise OpenMeteoSurfApiClientAuthenticationError(
                        "Authentication error"
                    )
                response.raise_for_status()
                return await response.json()

        except asyncio.TimeoutError as exception:
            raise OpenMeteoSurfApiClientCommunicationError(
                "Timeout error fetching information",
            ) from exception
        except (aiohttp.ClientError, socket.gaierror) as exception:
            raise OpenMeteoSurfApiClientCommunicationError(
                "Error fetching information",
            ) from exception
        except Exception as exception:  # pylint: disable=broad-except
            raise OpenMeteoSurfApiClientError(
                "Something really wrong happened!"
            ) from exception

    def _process_data(self, marine_data: dict, forecast_data: dict) -> dict:
        """Process and consolidate data."""
        # Open-Meteo returns a list of values for each hour.
        # We take the first index (current hour) or match based on 'time' if needed.
        # For simplicity, we assume index 0 is close enough or match it.
        
        # In a real scenario, we might want to find the entry closest to 'now'.
        # For now, let's just grab the first hourly entry as a placeholder.
        
        result = {}
        
        if "hourly" in marine_data:
            for key, values in marine_data["hourly"].items():
                if values:
                    result[key] = values[0]
                    
        if "hourly" in forecast_data:
            for key, values in forecast_data["hourly"].items():
                if values:
                    result[key] = values[0]
                    
        return result
