# PRD: Home Assistant Open-Meteo Surf Integration

## 1. Introduction
The **Open-Meteo Surf** integration for Home Assistant provides surfers and marine enthusiasts with real-time and forecasted wave, wind, and sea conditions using the [Open-Meteo Marine Weather API](https://open-meteo.com/en/docs/marine-weather-api) and [Weather Forecast API](https://open-meteo.com/en/docs).

## 2. Objective
To deliver a high-quality, easy-to-configure Home Assistant integration that provides all essential data points for determining surf conditions at a specific geographical location.

## 3. Target Audience
Surfers, windsurfers, kite-surfers, and anyone interested in marine conditions who uses Home Assistant.

## 4. Data Requirements
The integration will pull data from two Open-Meteo endpoints:

### 4.1. Marine Weather API (`/v1/marine`)
*   **Wave Height (`wave_height`):** Significant wave height in meters.
*   **Wave Period (`wave_period`):** Wave period in seconds.
*   **Wave Direction (`wave_direction`):** Direction from which waves are traveling (0-360°).
*   **Swell Height (`swell_wave_height`):** Height of the swell component.
*   **Swell Period (`swell_wave_period`):** Period of the swell component.
*   **Swell Direction (`swell_wave_direction`):** Direction of the swell.
*   **Water Temperature (`sea_surface_temperature`):** Temperature of the sea surface.
*   **Sea Level Height (`sea_level_height`):** Total water height (including tides).

### 4.2. Weather Forecast API (`/v1/forecast`)
*   **Wind Speed (`wind_speed_10m`):** Local wind speed at 10m height.
*   **Wind Direction (`wind_direction_10m`):** Local wind direction.
*   **Wind Gusts (`wind_gusts_10m`):** Local wind gusts.
*   **Air Temperature (`temperature_2m`):** Local air temperature.
*   **Precipitation (`precipitation`):** Local precipitation.

## 5. Functional Requirements

### 5.1. Configuration
*   **Config Flow:** Users should be able to add the integration via the Home Assistant UI.
*   **Location:** Users provide Latitude and Longitude (defaults to Home Assistant's configured location).
*   **Name:** Option to name the specific "Surf Spot" instance.

### 5.2. Entities (Sensors)
The integration will create multiple `sensor` entities:
*   `sensor.surf_wave_height`
*   `sensor.surf_wave_period`
*   `sensor.surf_wave_direction`
*   `sensor.surf_swell_height`
*   `sensor.surf_swell_period`
*   `sensor.surf_swell_direction`
*   `sensor.surf_water_temperature`
*   `sensor.surf_sea_level`
*   `sensor.surf_wind_speed`
*   `sensor.surf_wind_direction`
*   `sensor.surf_wind_gusts`
*   `sensor.surf_air_temperature`
*   `sensor.surf_precipitation`

### 5.3. Update Interval
*   Default update interval: 1 hour (aligns with Open-Meteo's hourly data availability and respects API limits).
*   Adjustable in options (optional).

## 6. Non-Functional Requirements
*   **Stability:** Handle API timeouts and connectivity issues gracefully (mark entities as unavailable).
*   **Efficiency:** Use a single `DataUpdateCoordinator` to fetch all data in a single (or dual) batch request to minimize API calls.
*   **Naming Conventions:** Follow Home Assistant's `sensor` platform guidelines and naming conventions.
*   **Translations:** Support for localization (at least English initially).

## 7. Future Considerations
*   Binary sensors for "Good Surf Conditions" based on user-defined thresholds (e.g., Wave Height > 1m AND Wind = Offshore).
*   Forecast entities for the next 24-48 hours.
*   Map card integration or custom Lovelace card for surf visualization.
