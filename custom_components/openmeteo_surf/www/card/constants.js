/**
 * Open-Meteo Surf Card — Constants
 */

export const DEFAULT_SHOW_PARAMS = [
  "wave_height",
  "wave_period",
  "wave_direction",
  "swell_wave_height",
  "wind_speed",
  "wind_direction",
  "temperature",
];

export const PARAM_META = {
  wave_height: { label: "Waves", unit: "m", icon: "🌊", desc: "Significant wave height (average of highest 1/3 of waves)" },
  wave_period: { label: "Period", unit: "s", icon: "⏱️", desc: "Dominant wave period (time between wave crests)" },
  wave_direction: { label: "Wave Dir", unit: "°", icon: "🧭", desc: "Direction waves are coming from (0° = N, 90° = E)" },
  swell_wave_height: { label: "Swell", unit: "m", icon: "🌊", desc: "Swell wave height (waves from distant storms)" },
  swell_wave_period: { label: "Swell Per", unit: "s", icon: "⏱️", desc: "Swell wave period" },
  swell_wave_direction: { label: "Swell Dir", unit: "°", icon: "🧭", desc: "Direction swell is coming from" },
  sea_surface_temperature: { label: "Water", unit: "°C", icon: "🌡️", desc: "Sea surface temperature" },
  temperature: { label: "Air", unit: "°C", icon: "🌡️", desc: "Air temperature at 2 m height" },
  wind_speed: { label: "Wind", unit: "kt", icon: "💨", desc: "Wind speed at 10 m height (knots)" },
  wind_direction: { label: "Wind Dir", unit: "°", icon: "🧭", desc: "Wind direction (where wind is coming from)" },
  precipitation: { label: "Rain", unit: "mm", icon: "🌧️", desc: "Precipitation (rain + snow) in the period" },
  wave_height_max: { label: "Max Waves", unit: "m", icon: "🌊", desc: "Maximum significant wave height for the day" },
  wave_period_max: { label: "Max Period", unit: "s", icon: "⏱️", desc: "Maximum wave period for the day" },
  wave_direction_dominant: { label: "Wave Dir", unit: "°", icon: "🧭", desc: "Dominant wave direction for the day" },
  swell_wave_height_max: { label: "Max Swell", unit: "m", icon: "🌊", desc: "Maximum swell height for the day" },
  swell_wave_period_max: { label: "Max Swell Per", unit: "s", icon: "⏱️", desc: "Maximum swell period for the day" },
  temperature_max: { label: "Max Temp", unit: "°C", icon: "🌡️", desc: "Maximum air temperature" },
  temperature_min: { label: "Min Temp", unit: "°C", icon: "🌡️", desc: "Minimum air temperature" },
  wind_speed_max: { label: "Max Wind", unit: "kt", icon: "💨", desc: "Maximum wind speed for the day (knots)" },
  precipitation_sum: { label: "Total Rain", unit: "mm", icon: "🌧️", desc: "Total precipitation for the day" },
};

export const HOURLY_KEY_MAP = {
  wave_height: "native_wave_height",
  wave_period: "native_wave_period",
  wave_direction: "native_wave_direction",
  swell_wave_height: "native_swell_wave_height",
  swell_wave_period: "native_swell_wave_period",
  swell_wave_direction: "native_swell_wave_direction",
  sea_surface_temperature: "native_sea_surface_temperature",
  temperature: "temperature",
  wind_speed: "wind_speed",
  wind_direction: "wind_bearing",
  precipitation: "precipitation",
};

export const DAILY_KEY_MAP = {
  wave_height: "native_wave_height_max",
  wave_height_max: "native_wave_height_max",
  wave_period: "native_wave_period_max",
  wave_period_max: "native_wave_period_max",
  wave_direction: "native_wave_direction_dominant",
  wave_direction_dominant: "native_wave_direction_dominant",
  swell_wave_height: "native_swell_wave_height_max",
  swell_wave_height_max: "native_swell_wave_height_max",
  swell_wave_period: "native_swell_wave_period_max",
  swell_wave_period_max: "native_swell_wave_period_max",
  temperature: "temperature",
  temperature_max: "temperature",
  temperature_min: "templow",
  wind_speed: "wind_speed",
  wind_speed_max: "wind_speed",
  precipitation: "precipitation",
  precipitation_sum: "precipitation",
  wind_direction: "wind_bearing",
};

export const CONDITION_ICONS = {
  sunny: "☀️",
  partlycloudy: "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  rainy: "🌧️",
  pouring: "🌧️",
  snowy: "🌨️",
  "lightning-rainy": "⛈️",
  exceptional: "⚠️",
};

