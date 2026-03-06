"""Sensor platform for Open-Meteo Surf."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    DEGREE,
    UnitOfLength,
    UnitOfPrecipitationDepth,
    UnitOfSpeed,
    UnitOfTemperature,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_NAME, DOMAIN
from .coordinator import OpenMeteoSurfDataUpdateCoordinator

@dataclass
class OpenMeteoSurfSensorEntityDescription(SensorEntityDescription):
    """Class describing Open-Meteo Surf sensor entities."""
    value_fn: Callable[[dict[str, Any]], Any] | None = None

SENSORS: tuple[OpenMeteoSurfSensorEntityDescription, ...] = (
    OpenMeteoSurfSensorEntityDescription(
        key="wave_height",
        name="Wave Height",
        native_unit_of_measurement=UnitOfLength.METERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:water",
        value_fn=lambda data: data.get("wave_height"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="wave_period",
        name="Wave Period",
        native_unit_of_measurement=UnitOfTime.SECONDS,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:timer-outline",
        value_fn=lambda data: data.get("wave_period"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="wave_direction",
        name="Wave Direction",
        native_unit_of_measurement=DEGREE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:compass-outline",
        value_fn=lambda data: data.get("wave_direction"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="swell_wave_height",
        name="Swell Height",
        native_unit_of_measurement=UnitOfLength.METERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:waves",
        value_fn=lambda data: data.get("swell_wave_height"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="swell_wave_period",
        name="Swell Period",
        native_unit_of_measurement=UnitOfTime.SECONDS,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:timer-outline",
        value_fn=lambda data: data.get("swell_wave_period"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="swell_wave_direction",
        name="Swell Direction",
        native_unit_of_measurement=DEGREE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:compass-outline",
        value_fn=lambda data: data.get("swell_wave_direction"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="sea_surface_temperature",
        name="Water Temperature",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:thermometer-water",
        value_fn=lambda data: data.get("sea_surface_temperature"),
    ),

    OpenMeteoSurfSensorEntityDescription(
        key="wind_speed_10m",
        name="Wind Speed",
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        device_class=SensorDeviceClass.WIND_SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:weather-windy",
        value_fn=lambda data: data.get("wind_speed_10m"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="wind_direction_10m",
        name="Wind Direction",
        native_unit_of_measurement=DEGREE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:compass-outline",
        value_fn=lambda data: data.get("wind_direction_10m"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="wind_gusts_10m",
        name="Wind Gusts",
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
        device_class=SensorDeviceClass.WIND_SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:weather-windy",
        value_fn=lambda data: data.get("wind_gusts_10m"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="temperature_2m",
        name="Air Temperature",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:thermometer",
        value_fn=lambda data: data.get("temperature_2m"),
    ),
    OpenMeteoSurfSensorEntityDescription(
        key="precipitation",
        name="Precipitation",
        native_unit_of_measurement=UnitOfPrecipitationDepth.MILLIMETERS,
        device_class=SensorDeviceClass.PRECIPITATION,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:weather-rainy",
        value_fn=lambda data: data.get("precipitation"),
    ),
)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the sensor platform."""
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        OpenMeteoSurfSensor(coordinator, entry, description)
        for description in SENSORS
    )

class OpenMeteoSurfSensor(CoordinatorEntity, SensorEntity):
    """Representation of an Open-Meteo Surf sensor."""

    entity_description: OpenMeteoSurfSensorEntityDescription

    def __init__(
        self,
        coordinator: OpenMeteoSurfDataUpdateCoordinator,
        entry: ConfigEntry,
        description: OpenMeteoSurfSensorEntityDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.data.get(CONF_NAME, "Surf Spot"),
            manufacturer="Open-Meteo",
            entry_type="service",
        )

    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        if self.coordinator.data is None:
            return None
        current = self.coordinator.data.get("current", {})
        return self.entity_description.value_fn(current)
