# Open-Meteo Surf Dashboard Templates

## Custom Surf Forecast Card (Recommended)

The integration includes a custom Lovelace card that displays current conditions and hourly/daily forecasts in a surf-optimized layout.

### Basic usage

```yaml
type: custom:openmeteo-surf-card
entity: weather.open_meteo_surf
```

### Full configuration

```yaml
type: custom:openmeteo-surf-card
entity: weather.open_meteo_surf
title: "My Surf Spot"
forecast_type: both            # "hourly" | "daily" | "both"
show_params:
  - wave_height
  - wave_period
  - wave_direction
  - swell_wave_height
  - wind_speed
  - wind_direction
  - temperature
  - precipitation
  - sea_surface_temperature
```

### Configuration options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `entity` | ✅ | – | Weather entity ID (e.g. `weather.pipeline`) |
| `title` | ❌ | Entity name | Card title override |
| `forecast_type` | ❌ | `both` | `hourly`, `daily`, or `both` |
| `show_params` | ❌ | (all main params) | Which parameters to show in forecast table |

### Available parameters

| Key | Description |
|-----|-------------|
| `wave_height` | Wave height (m) |
| `wave_period` | Wave period (s) |
| `wave_direction` | Wave direction (°) |
| `swell_wave_height` | Swell wave height (m) |
| `swell_wave_period` | Swell period (s) |
| `swell_wave_direction` | Swell direction (°) |
| `sea_surface_temperature` | Water temperature (°C) |
| `temperature` | Air temperature (°C) |
| `wind_speed` | Wind speed (km/h) |
| `wind_direction` | Wind direction (°) |
| `precipitation` | Precipitation (mm) |

### Card setup

The card resource is auto-registered when the integration loads. If it doesn't appear, manually add this resource:

**Settings → Dashboards → Resources → Add Resource:**
- URL: `/openmeteo_surf/openmeteo-surf-card.js`
- Type: JavaScript Module

---

## Sensor-based Dashboard (Alternative)

This YAML uses the individual sensor entities for a simpler view without forecasts.
**Note:** Replace `open_meteo_surf` with your actual surf spot's entity name.

```yaml
type: vertical-stack
cards:
  - type: entity
    entity: sensor.open_meteo_surf_wave_height
    name: "🌊 Current Wave Height"
    icon: mdi:water
    attribute: unit_of_measurement

  - type: horizontal-stack
    cards:
      - type: gauge
        entity: sensor.open_meteo_surf_wave_height
        min: 0
        max: 5
        needle: true
        severity:
          green: 0
          yellow: 1.5
          red: 3
        name: "🌊 Waves (m)"
      - type: gauge
        entity: sensor.open_meteo_surf_wind_speed
        min: 0
        max: 50
        needle: true
        name: "🌬️ Wind (km/h)"

  - type: glance
    show_name: true
    show_icon: true
    show_state: true
    entities:
      - entity: sensor.open_meteo_surf_wave_period
        name: "⏱️ Period"
        icon: mdi:timer-outline
      - entity: sensor.open_meteo_surf_wave_direction
        name: "🧭 Direction"
        icon: mdi:compass-outline
      - entity: sensor.open_meteo_surf_swell_height
        name: "🌊 Swell"
        icon: mdi:waves

  - type: entities
    title: "🌊 Detailed Marine Conditions"
    show_header_toggle: false
    entities:
      - entity: sensor.open_meteo_surf_swell_period
        name: "⏱️ Swell Period"
      - entity: sensor.open_meteo_surf_swell_direction
        name: "🧭 Swell Direction"
      - entity: sensor.open_meteo_surf_sea_surface_temperature
        name: "🌡️ Water Temp"
      - entity: sensor.open_meteo_surf_sea_level
        name: "📏 Sea Level (Tide)"

  - type: entities
    title: "🌦️ Local Weather"
    show_header_toggle: false
    entities:
      - entity: sensor.open_meteo_surf_air_temperature
        name: "🌡️ Air Temp"
      - entity: sensor.open_meteo_surf_wind_gusts
        name: "🌪️ Wind Gusts"
      - entity: sensor.open_meteo_surf_precipitation
        name: "🌧️ Precipitation"

  - type: button
    name: "🔄 Refresh Data Now"
    icon: mdi:refresh
    action_name: Refresh
    tap_action:
      action: call-service
      service: button.press
      target:
        entity_id: button.open_meteo_surf_refresh
```
