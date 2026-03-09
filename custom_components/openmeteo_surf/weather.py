"""Weather platform for Open-Meteo Surf."""
from __future__ import annotations

from typing import Any

from homeassistant.components.weather import (
    Forecast,
    WeatherEntity,
    WeatherEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    UnitOfPrecipitationDepth,
    UnitOfSpeed,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_NAME, DOMAIN, WMO_TO_HA_CONDITION
from .coordinator import OpenMeteoSurfDataUpdateCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the weather platform."""
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([OpenMeteoSurfWeather(coordinator, entry)])


class OpenMeteoSurfWeather(CoordinatorEntity, WeatherEntity):
    """Representation of an Open-Meteo Surf weather entity."""

    _attr_native_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_native_wind_speed_unit = UnitOfSpeed.KNOTS
    _attr_native_precipitation_unit = UnitOfPrecipitationDepth.MILLIMETERS
    _attr_supported_features = (
        WeatherEntityFeature.FORECAST_DAILY
        | WeatherEntityFeature.FORECAST_HOURLY
    )

    def __init__(
        self,
        coordinator: OpenMeteoSurfDataUpdateCoordinator,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the weather entity."""
        super().__init__(coordinator)
        spot_name = entry.data.get(CONF_NAME, "Surf Spot")
        self._attr_name = spot_name
        self._attr_unique_id = f"{entry.entry_id}_weather"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=spot_name,
            manufacturer="Open-Meteo",
            entry_type="service",
        )

    # ── Current condition properties ─────────────────────────────────

    @property
    def _current(self) -> dict:
        """Return current data dict."""
        if self.coordinator.data is None:
            return {}
        return self.coordinator.data.get("current", {})

    @property
    def condition(self) -> str | None:
        """Return the current condition."""
        code = self._current.get("weather_code")
        if code is None:
            return None
        return WMO_TO_HA_CONDITION.get(int(code), "exceptional")

    @property
    def native_temperature(self) -> float | None:
        """Return the air temperature."""
        return self._current.get("temperature_2m")

    @property
    def native_wind_speed(self) -> float | None:
        """Return the wind speed."""
        return self._current.get("wind_speed_10m")

    @property
    def native_wind_gust_speed(self) -> float | None:
        """Return the wind gust speed."""
        return self._current.get("wind_gusts_10m")

    @property
    def wind_bearing(self) -> float | None:
        """Return the wind bearing."""
        return self._current.get("wind_direction_10m")

    @property
    def native_precipitation(self) -> float | None:
        """Return the precipitation."""
        return self._current.get("precipitation")

    # ── Extra state attributes (surf-specific) ────────────────────────

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return surf-specific attributes."""
        c = self._current
        return {
            "wave_height": c.get("wave_height"),
            "wave_period": c.get("wave_period"),
            "wave_direction": c.get("wave_direction"),
            "swell_wave_height": c.get("swell_wave_height"),
            "swell_wave_period": c.get("swell_wave_period"),
            "swell_wave_direction": c.get("swell_wave_direction"),
            "sea_surface_temperature": c.get("sea_surface_temperature"),
        }

    # ── Forecasts ─────────────────────────────────────────────────────

    async def async_forecast_hourly(self) -> list[Forecast] | None:
        """Return the hourly forecast."""
        if self.coordinator.data is None:
            return None

        hourly_data = self.coordinator.data.get("hourly", [])
        forecasts: list[Forecast] = []

        for entry in hourly_data:
            wmo_code = entry.get("weather_code")
            condition = (
                WMO_TO_HA_CONDITION.get(int(wmo_code), "exceptional")
                if wmo_code is not None
                else None
            )
            forecast = Forecast(
                datetime=entry["datetime"],
                condition=condition,
                native_temperature=entry.get("temperature_2m"),
                native_precipitation=entry.get("precipitation"),
                native_wind_speed=entry.get("wind_speed_10m"),
                wind_bearing=entry.get("wind_direction_10m"),
            )
            # Add marine data to forecast
            forecast["native_wave_height"] = entry.get("wave_height")
            forecast["native_wave_period"] = entry.get("wave_period")
            forecast["native_wave_direction"] = entry.get("wave_direction")
            forecast["native_swell_wave_height"] = entry.get("swell_wave_height")
            forecast["native_swell_wave_period"] = entry.get("swell_wave_period")
            forecast["native_swell_wave_direction"] = entry.get("swell_wave_direction")
            forecast["native_sea_surface_temperature"] = entry.get("sea_surface_temperature")
            
            forecasts.append(forecast)

        return forecasts

    async def async_forecast_daily(self) -> list[Forecast] | None:
        """Return the daily forecast."""
        if self.coordinator.data is None:
            return None

        daily_data = self.coordinator.data.get("daily", [])
        forecasts: list[Forecast] = []

        for entry in daily_data:
            wmo_code = entry.get("weather_code")
            condition = (
                WMO_TO_HA_CONDITION.get(int(wmo_code), "exceptional")
                if wmo_code is not None
                else None
            )
            forecast = Forecast(
                datetime=entry["datetime"],
                condition=condition,
                native_temperature=entry.get("temperature_2m_max"),
                native_templow=entry.get("temperature_2m_min"),
                native_precipitation=entry.get("precipitation_sum"),
                native_wind_speed=entry.get("wind_speed_10m_max"),
            )
            # Add marine data to forecast
            forecast["native_wave_height_max"] = entry.get("wave_height_max")
            forecast["native_wave_period_max"] = entry.get("wave_period_max")
            forecast["native_wave_direction_dominant"] = entry.get("wave_direction_dominant")
            forecast["native_swell_wave_height_max"] = entry.get("swell_wave_height_max")
            forecast["native_swell_wave_period_max"] = entry.get("swell_wave_period_max")
            
            forecasts.append(forecast)

        return forecasts
