# Open-Meteo Surf Dashboard Template

This YAML can be used in a "Manual" card or in your Dashboard YAML configuration. 
**Note:** Replace `<surf_spot_slug>` with your actual surf spot's entity name (e.g., `pipeline` if you named it "Pipeline").

```yaml
type: vertical-stack
cards:
  - type: entity
    entity: sensor.<surf_spot_slug>_wave_height
    name: "🌊 Current Wave Height"
    icon: mdi:water
    attribute: unit_of_measurement

  - type: horizontal-stack
    cards:
      - type: gauge
        entity: sensor.<surf_spot_slug>_wave_height
        min: 0
        max: 5
        needle: true
        severity:
          green: 0
          yellow: 1.5
          red: 3
        name: "🌊 Waves (m)"
      - type: gauge
        entity: sensor.<surf_spot_slug>_wind_speed
        min: 0
        max: 50
        needle: true
        name: "🌬️ Wind (km/h)"

  - type: glance
    show_name: true
    show_icon: true
    show_state: true
    entities:
      - entity: sensor.<surf_spot_slug>_wave_period
        name: "⏱️ Period"
        icon: mdi:timer-outline
      - entity: sensor.<surf_spot_slug>_wave_direction
        name: "🧭 Direction"
        icon: mdi:compass-outline
      - entity: sensor.<surf_spot_slug>_swell_height
        name: "🌊 Swell"
        icon: mdi:waves

  - type: entities
    title: "🌊 Detailed Marine Conditions"
    show_header_toggle: false
    entities:
      - entity: sensor.<surf_spot_slug>_swell_period
        name: "⏱️ Swell Period"
      - entity: sensor.<surf_spot_slug>_swell_direction
        name: "🧭 Swell Direction"
      - entity: sensor.<surf_spot_slug>_sea_surface_temperature
        name: "🌡️ Water Temp"
      - entity: sensor.<surf_spot_slug>_sea_level
        name: "📏 Sea Level (Tide)"

  - type: entities
    title: "🌦️ Local Weather"
    show_header_toggle: false
    entities:
      - entity: sensor.<surf_spot_slug>_air_temperature
        name: "🌡️ Air Temp"
      - entity: sensor.<surf_spot_slug>_wind_gusts
        name: "🌪️ Wind Gusts"
      - entity: sensor.<surf_spot_slug>_precipitation
        name: "🌧️ Precipitation"

  - type: button
    name: "🔄 Refresh Data Now"
    icon: mdi:refresh
    action_name: Refresh
    tap_action:
      action: call-service
      service: button.press
      target:
        entity_id: button.<surf_spot_slug>_refresh
```
