# Open-Meteo Surf Integration for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
![License](https://img.shields.io/github/license/tomerbrown/ha-openmeteo-surf)

A Home Assistant integration that provides detailed surfing and marine weather data using the Open-Meteo APIs.

## Features
- **🌊 Marine Data:** Wave height, period, and direction; Swell height, period, and direction; Water temperature; Sea level height.
- **🌬️ Atmospheric Data:** Wind speed, direction, and gusts; Air temperature; Precipitation.
- **⏱️ Configurable Polling:** Choose update intervals from 5 to 360 minutes.
- **🔄 Manual Refresh:** A dedicated button to force an immediate update.
- **📍 Multi-Location:** Add multiple surf spots as separate devices.

## Installation

### Option 1: HACS (Recommended)
1. Ensure [HACS](https://hacs.xyz/) is installed.
2. Open **HACS** from your Home Assistant sidebar.
3. Click the **three dots** in the top right corner and select **Custom repositories**.
4. Paste the URL of this repository: `https://github.com/tomerbrown/ha-openmeteo-surf`
5. Select **Integration** as the category and click **Add**.
6. Find **Open-Meteo Surf** in the HACS list and click **Download**.
7. **Restart** Home Assistant.

### Option 2: Manual
1. Download the latest release or clone this repository.
2. Copy the `custom_components/openmeteo_surf` folder into your Home Assistant's `custom_components` directory.
3. **Restart** Home Assistant.

## Setup
1. In the Home Assistant UI, go to **Settings** -> **Devices & Services**.
2. Click **+ Add Integration** in the bottom right.
3. Search for **Open-Meteo Surf** and select it.
4. Enter the details for your surf spot:
   - **Name:** e.g., "Pipeline"
   - **Latitude/Longitude:** Coordinates for the spot (defaults to your home location).
5. Once added, you can click **Configure** on the integration card to adjust the **Update Interval**.

## Dashboard UI
We have provided a beautiful dashboard template with icons and emojis. See [docs/UI.md](docs/UI.md) for the YAML code.

> `![Card Example](https://raw.githubusercontent.com/tomerbrown/ha-openmeteo-surf/main/docs/card_example.png)`

## Local Testing
To test this integration locally without affecting your main Home Assistant instance, you can run a fresh Home Assistant container using Docker:

1. Ensure Docker is installed.
2. Run the following command from the root of this repository:

```bash
docker run -d \
  --name homeassistant-test \
  --privileged \
  --restart=unless-stopped \
  -e TZ=America/Los_Angeles \
  -v $(pwd)/custom_components:/config/custom_components \
  -v $(pwd)/config:/config \
  -p 8123:8123 \
  ghcr.io/home-assistant/home-assistant:stable
```
3. Open `http://localhost:8123` in your browser. This will mount your current codebase straight into Home Assistant.

## Metrics Included
| Entity | Unit | Description |
| :--- | :--- | :--- |
| `wave_height` | m | Significant wave height |
| `wave_period` | s | Wave period |
| `wave_direction` | ° | Wave direction |
| `swell_wave_height` | m | Swell wave height |
| `swell_wave_period` | s | Swell wave period |
| `swell_wave_direction` | ° | Swell wave direction |
| `sea_surface_temperature` | °C | Water temperature |
| `sea_level_height` | m | Sea level including tides |
| `wind_speed_10m` | km/h | Wind speed |
| `wind_direction_10m` | ° | Wind direction |
| `wind_gusts_10m` | km/h | Wind gusts |
| `temperature_2m` | °C | Air temperature |
| `precipitation` | mm | Precipitation |

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
