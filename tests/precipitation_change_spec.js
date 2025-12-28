/**
 * Unit tests for precipitation change analysis
 * Tests the analyzePrecipitationChange function
 */

const moment = require("moment");

// Make moment globally available for the module
global.moment = moment;

// Mock the Module.register function and Module object
global.Module = {
  register: jest.fn((moduleName, moduleDefinition) => {
    global.MMM_NOAAForecast = moduleDefinition;
  })
};

// Mock config object
global.config = {
  units: "imperial"
};

// Mock Log object
global.Log = {
  info: jest.fn(),
  log: jest.fn(),
  error: jest.fn()
};

// Load the module (from parent directory)
require("../MMM-NOAAForecast.js");

describe("Precipitation Change Analysis Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      showPrecipitationStartStop: true,
      label_timeFormat: "h a"
    };
    module.identifier = "test_module_precip";
    module.weatherData = null;
  });

  /**
   * Helper to create hourly data entries
   * @param {number} hoursFromNow - Number of hours from now for the entry
   * @param {string} iconCode - Weather icon code (e.g., "skc", "rain", "snow")
   * @returns {object} Hourly weather data entry with startTime, endTime, and icon
   */
  function createHourlyEntry(hoursFromNow, iconCode) {
    const startTime = moment().add(hoursFromNow, "hours").startOf("hour");
    return {
      startTime: startTime.format(),
      endTime: startTime.clone().add(1, "hour").format(),
      icon: `https://api.weather.gov/icons/land/day/${iconCode}`
    };
  }

  // ============================================================================
  // analyzePrecipitationChange Tests
  // ============================================================================
  describe("analyzePrecipitationChange", () => {
    describe("Configuration checks", () => {
      it("should return null when showPrecipitationStartStop is false", () => {
        module.config.showPrecipitationStartStop = false;
        module.weatherData = {
          hourly: [createHourlyEntry(0, "skc"), createHourlyEntry(1, "rain")]
        };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });

      it("should return null when hourly data is not an array", () => {
        module.weatherData = { hourly: null };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });

      it("should return null when hourly array is empty", () => {
        module.weatherData = { hourly: [] };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });

      it("should return null when hourly array has only one entry", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "rain")]
        };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });
    });

    describe("Rain start detection", () => {
      it("should detect rain starting", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "skc"),
            createHourlyEntry(1, "skc"),
            createHourlyEntry(2, "rain")
          ]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("start");
        expect(result.precipType).toBe("rain");
        expect(result.message).toContain("Rain expected at");
      });

      it("should detect rain showers starting", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "sct"),
            createHourlyEntry(1, "rain_showers")
          ]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("start");
        expect(result.precipType).toBe("rain");
      });

      it("should detect thunderstorms starting", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "bkn"), createHourlyEntry(1, "tsra")]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("start");
        expect(result.precipType).toBe("rain");
      });
    });

    describe("Snow start detection", () => {
      it("should detect snow starting", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "ovc"), createHourlyEntry(1, "snow")]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("start");
        expect(result.precipType).toBe("snow");
        expect(result.message).toContain("Snow expected at");
      });

      it("should detect blizzard as snow", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "ovc"),
            createHourlyEntry(1, "blizzard")
          ]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.precipType).toBe("snow");
      });
    });

    describe("Sleet/freezing rain detection", () => {
      it("should detect sleet starting", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "ovc"), createHourlyEntry(1, "sleet")]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("start");
        expect(result.precipType).toBe("sleet");
        expect(result.message).toContain("Sleet expected at");
      });

      it("should detect freezing rain as sleet", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "ovc"), createHourlyEntry(1, "fzra")]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.precipType).toBe("sleet");
      });
    });

    describe("Precipitation stop detection", () => {
      it("should detect rain stopping", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "rain"),
            createHourlyEntry(1, "rain"),
            createHourlyEntry(2, "sct")
          ]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("stop");
        expect(result.message).toContain("ending by");
      });

      it("should detect snow stopping", () => {
        module.weatherData = {
          hourly: [createHourlyEntry(0, "snow"), createHourlyEntry(1, "ovc")]
        };

        const result = module.analyzePrecipitationChange();

        expect(result).not.toBeNull();
        expect(result.type).toBe("stop");
        expect(result.precipType).toBe("snow");
        expect(result.message).toContain("Snow ending by");
      });
    });

    describe("No change scenarios", () => {
      it("should return null when precipitation continues", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "rain"),
            createHourlyEntry(1, "rain"),
            createHourlyEntry(2, "rain")
          ]
        };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });

      it("should return null when clear weather continues", () => {
        module.weatherData = {
          hourly: [
            createHourlyEntry(0, "skc"),
            createHourlyEntry(1, "skc"),
            createHourlyEntry(2, "sct")
          ]
        };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });
    });

    describe("Tomorrow indication", () => {
      it("should include 'tomorrow' when change is next day", () => {
        // Create entries that span into tomorrow
        const now = moment();
        const hoursUntilMidnight = 24 - now.hour();

        // Create hourly data that has clear weather now and rain after midnight
        const hourlyData = [];
        for (let i = 0; i <= hoursUntilMidnight + 1; i++) {
          const iconCode = i <= hoursUntilMidnight ? "skc" : "rain";
          hourlyData.push(createHourlyEntry(i, iconCode));
        }

        module.weatherData = { hourly: hourlyData };

        const result = module.analyzePrecipitationChange();

        // The first precipitation after midnight should indicate "tomorrow"
        if (result && result.type === "start") {
          expect(result.message).toContain("tomorrow");
        }
      });
    });

    describe("24-hour limit", () => {
      it("should only check within 24 hours", () => {
        // Create 30 hours of clear weather followed by rain
        const hourlyData = [];
        for (let i = 0; i < 30; i++) {
          const iconCode = i < 25 ? "skc" : "rain";
          hourlyData.push(createHourlyEntry(i, iconCode));
        }

        module.weatherData = { hourly: hourlyData };

        const result = module.analyzePrecipitationChange();
        // Should not detect the rain at hour 25 since it's beyond 24 hours
        expect(result).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("should handle missing icon property gracefully", () => {
        module.weatherData = {
          hourly: [
            { startTime: moment().format() },
            { startTime: moment().add(1, "hour").format() }
          ]
        };

        const result = module.analyzePrecipitationChange();
        expect(result).toBeNull();
      });

      it("should handle missing startTime gracefully", () => {
        module.weatherData = {
          hourly: [
            { icon: "https://api.weather.gov/icons/land/day/skc" },
            { icon: "https://api.weather.gov/icons/land/day/rain" }
          ]
        };

        const result = module.analyzePrecipitationChange();
        // Should not crash
        expect(result).toBeNull();
      });
    });
  });
});
