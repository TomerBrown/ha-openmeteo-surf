# Open-Meteo Surf Integration for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

A Home Assistant integration that provides detailed surfing and marine weather data using the Open-Meteo APIs.

## Features
- **Marine Data:** Wave height, period, and direction; Swell height, period, and direction; Water temperature; Sea level height.
- **Atmospheric Data:** Wind speed, direction, and gusts; Air temperature; Precipitation.
- **Configurable Polling:** Choose update intervals from 5 to 360 minutes.
- **Manual Refresh:** A dedicated button to force an immediate update.
- **Multi-Location:** Add multiple surf spots as separate devices.

## Installation

### Manual
1. Copy the `custom_components/openmeteo_surf` directory to your Home Assistant `custom_components` folder.
2. Restart Home Assistant.
3. In the Home Assistant UI, go to **Settings** -> **Devices & Services** -> **Add Integration**.
4. Search for "Open-Meteo Surf" and follow the instructions.

## Configuration
During setup, you will be asked for:
- **Surf Spot Name:** A friendly name for the location.
- **Latitude/Longitude:** The coordinates of the surf spot (defaults to your Home Assistant location).

### Options
After setup, you can click **Configure** on the integration card to change the **Update Interval**.

## Dashboard UI
See [docs/UI.md](docs/UI.md) for a ready-to-use YAML template to create a beautiful dashboard for your surf spot.

## Metrics Included
- `wave_height`: Significant wave height (m)
- `wave_period`: Wave period (s)
- `wave_direction`: Wave direction (°)
- `swell_wave_height`: Swell wave height (m)
- `swell_wave_period`: Swell wave period (s)
- `swell_wave_direction`: Swell wave direction (°)
- `sea_surface_temperature`: Water temperature (°C)
- `sea_level_height`: Sea level including tides (m)
- `wind_speed_10m`: Wind speed (km/h)
- `wind_direction_10m`: Wind direction (°)
- `wind_gusts_10m`: Wind gusts (km/h)
- `temperature_2m`: Air temperature (°C)
- `precipitation`: Precipitation (mm)
