"""Test Open-Meteo Surf config flow."""
from unittest.mock import patch
import pytest
from homeassistant import config_entries, data_entry_flow
from homeassistant.core import HomeAssistant

from custom_components.openmeteo_surf.const import DOMAIN

@pytest.mark.asyncio
async def test_config_flow_success(hass: HomeAssistant):
    """Test successful config flow."""
    # Initialize a config flow
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )

    # Check that the config flow shows the user form
    assert result["type"] == data_entry_flow.FlowResultType.FORM
    assert result["step_id"] == "user"

    # Fill out the form and submit
    with patch(
        "custom_components.openmeteo_surf.api.OpenMeteoSurfApiClient.async_get_data",
        return_value={"wave_height": 1.0},
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                "name": "Pipeline",
                "latitude": -22.9,
                "longitude": -43.2,
            },
        )

    # Check that the config flow is complete and create an entry
    assert result["type"] == data_entry_flow.FlowResultType.CREATE_ENTRY
    assert result["title"] == "Pipeline"
    assert result["data"] == {
        "name": "Pipeline",
        "latitude": -22.9,
        "longitude": -43.2,
    }
    assert result["result"]
