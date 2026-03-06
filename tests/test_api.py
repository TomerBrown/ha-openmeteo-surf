"""Tests for the Open-Meteo Surf API client."""
import aiohttp
import pytest
from aioresponses import aioresponses

from custom_components.openmeteo_surf.api import OpenMeteoSurfApiClient
from custom_components.openmeteo_surf.const import FORECAST_API_URL, MARINE_API_URL

@pytest.mark.asyncio
async def test_api_get_data():
    """Test API get data."""
    async with aiohttp.ClientSession() as session:
        client = OpenMeteoSurfApiClient(latitude=52.52, longitude=13.41, session=session)
        
        with aioresponses() as m:
            # Mock Marine API
            m.get(
                f"{MARINE_API_URL}?hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature,sea_level_height&latitude=52.52&longitude=13.41",
                payload={
                    "hourly": {
                        "wave_height": [1.5],
                        "wave_period": [8.0],
                        "wave_direction": [270],
                        "swell_wave_height": [1.2],
                        "swell_wave_period": [10.0],
                        "swell_wave_direction": [260],
                        "sea_surface_temperature": [18.5],
                        "sea_level_height": [0.5],
                    }
                },
            )
            # Mock Forecast API
            m.get(
                f"{FORECAST_API_URL}?hourly=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&latitude=52.52&longitude=13.41",
                payload={
                    "hourly": {
                        "temperature_2m": [22.0],
                        "precipitation": [0.0],
                        "wind_speed_10m": [15.0],
                        "wind_direction_10m": [280],
                        "wind_gusts_10m": [25.0],
                    }
                },
            )

            data = await client.async_get_data()
            
            assert data["wave_height"] == 1.5
            assert data["swell_wave_height"] == 1.2
            assert data["wind_speed_10m"] == 15.0
            assert data["temperature_2m"] == 22.0
            assert data["sea_surface_temperature"] == 18.5
