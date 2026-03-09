# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-03-09

### Added
- **Surf card refresh button** — Manual refresh button in the card header (configurable: show/hide, show/hide "Refresh" text)
- **Tooltips** — Hover over forecast table headers and cells to see parameter name, unit, value, and detailed description
- **Release workflow** — GitHub Actions for HACS validation and automated releases

### Changed
- **Wind units** — Default wind speed changed from km/h to knots (kt) across integration, sensors, and UI card
- **Card editor** — Fixed title input losing focus while typing

## [0.1.0] - Initial release

### Added
- Marine weather data (wave height, period, direction; swell; water temperature)
- Atmospheric data (wind, temperature, precipitation)
- Configurable update interval (5–360 minutes)
- Manual refresh button entity
- Multi-location support
- Lovelace surf forecast card

[0.2.0]: https://github.com/tomerbrown/ha-openmeteo-surf/releases/tag/v0.2.0
[0.1.0]: https://github.com/tomerbrown/ha-openmeteo-surf/releases/tag/v0.1.0
