"""Tests for the Open-Meteo Surf weather platform."""
from unittest.mock import MagicMock

import pytest
from homeassistant.components.weather import (
    ATTR_FORECAST_CONDITION,
    ATTR_FORECAST_NATIVE_PRECIPITATION,
    ATTR_FORECAST_NATIVE_TEMP,
    ATTR_FORECAST_NATIVE_TEMP_LOW,
    ATTR_FORECAST_NATIVE_WIND_SPEED,
    ATTR_FORECAST_TIME,
    ATTR_FORECAST_WIND_BEARING,
)
from homeassistant.core import HomeAssistant

from custom_components.openmeteo_surf.const import DOMAIN
from custom_components.openmeteo_surf.weather import OpenMeteoSurfWeather

MOCK_DATA = {
    "current": {
        "temperature_2m": 22.0,
        "precipitation": 0.1,
        "wind_speed_10m": 15.0,
        "wind_direction_10m": 180,
        "wind_gusts_10m": 25.0,
        "weather_code": 1,
        "wave_height": 1.5,
        "wave_period": 8.0,
        "wave_direction": 270,
        "swell_wave_height": 1.2,
        "swell_wave_period": 10.0,
        "swell_wave_direction": 260,
        "sea_surface_temperature": 18.5,
    },
    "hourly": [
        {
            "datetime": "2026-03-06T12:00:00Z",
            "temperature_2m": 23.0,
            "precipitation": 0.0,
            "wind_speed_10m": 10.0,
            "wind_direction_10m": 190,
            "weather_code": 0,
        }
    ],
    "daily": [
        {
            "datetime": "2026-03-07T00:00:00Z",
            "temperature_2m_max": 25.0,
            "temperature_2m_min": 18.0,
            "precipitation_sum": 0.5,
            "wind_speed_10m_max": 20.0,
            "weather_code": 3,
        }
    ],
}

@pytest.fixture
def mock_coordinator():
    """Mock a coordinator."""
    coordinator = MagicMock()
    coordinator.data = MOCK_DATA
    return coordinator

@pytest.fixture
def mock_entry():
    """Mock a config entry."""
    entry = MagicMock()
    entry.data = {"name": "Test Spot"}
    entry.entry_id = "test_entry_id"
    return entry

async def test_weather_entity_properties(mock_coordinator, mock_entry):
    """Test weather entity basic properties."""
    entity = OpenMeteoSurfWeather(mock_coordinator, mock_entry)

    assert entity.name == "Test Spot"
    assert entity.unique_id == "test_entry_id_weather"
    assert entity.native_temperature == 22.0
    assert entity.native_wind_speed == 15.0
    assert entity.native_wind_gust_speed == 25.0
    assert entity.wind_bearing == 180
    assert entity.native_precipitation == 0.1
    assert entity.condition == "sunny"  # WMO 1 is sunny

    # Surf specific attributes
    attrs = entity.extra_state_attributes
    assert attrs["wave_height"] == 1.5
    assert attrs["wave_period"] == 8.0
    assert attrs["sea_surface_temperature"] == 18.5

async def test_weather_forecast_hourly(mock_coordinator, mock_entry):
    """Test hourly forecast."""
    entity = OpenMeteoSurfWeather(mock_coordinator, mock_entry)
    forecasts = await entity.async_forecast_hourly()

    assert len(forecasts) == 1
    f = forecasts[0]
    assert f[ATTR_FORECAST_TIME] == "2026-03-06T12:00:00Z"
    assert f[ATTR_FORECAST_NATIVE_TEMP] == 23.0
    assert f[ATTR_FORECAST_CONDITION] == "sunny" # WMO 0 is sunny
    assert f[ATTR_FORECAST_NATIVE_WIND_SPEED] == 10.0
    assert f[ATTR_FORECAST_WIND_BEARING] == 190

async def test_weather_forecast_daily(mock_coordinator, mock_entry):
    """Test daily forecast."""
    entity = OpenMeteoSurfWeather(mock_coordinator, mock_entry)
    forecasts = await entity.async_forecast_daily()

    assert len(forecasts) == 1
    f = forecasts[0]
    assert f[ATTR_FORECAST_TIME] == "2026-03-07T00:00:00Z"
    assert f[ATTR_FORECAST_NATIVE_TEMP] == 25.0
    assert f[ATTR_FORECAST_NATIVE_TEMP_LOW] == 18.0
    assert f[ATTR_FORECAST_CONDITION] == "cloudy" # WMO 3 is cloudy
    assert f[ATTR_FORECAST_NATIVE_PRECIPITATION] == 0.5
    assert f[ATTR_FORECAST_NATIVE_WIND_SPEED] == 20.0
