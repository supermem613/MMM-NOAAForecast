/**
 * Unit tests for calculateDailyMinMaxFromHourly and related functionality
 * Tests the new feature of calculating daily min/max temps from hourly data
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

describe("calculateDailyMinMaxFromHourly Tests", () => {
  let module;

  beforeEach(() => {
    // Create a new instance with default configuration
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      units: "imperial"
    };
    module.identifier = "test_module_daily_minmax";
    module.weatherData = null;
  });

  describe("calculateDailyMinMaxFromHourly", () => {
    it("should return null values when hourly data is not available", () => {
      module.weatherData = { hourly: null };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBeNull();
      expect(result.maxTemp).toBeNull();
    });

    it("should return null values when hourly array is empty", () => {
      module.weatherData = { hourly: [] };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBeNull();
      expect(result.maxTemp).toBeNull();
    });

    it("should return null values when daily start time is invalid", () => {
      module.weatherData = {
        hourly: [{ startTime: "2025-11-22T10:00:00-05:00", temperature: 65 }]
      };
      const result = module.calculateDailyMinMaxFromHourly("invalid-date");

      expect(result.minTemp).toBeNull();
      expect(result.maxTemp).toBeNull();
    });

    it("should calculate min and max from single hourly entry", () => {
      module.weatherData = {
        hourly: [{ startTime: "2025-11-22T10:00:00-05:00", temperature: 65 }]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(65);
      expect(result.maxTemp).toBe(65);
    });

    it("should calculate min and max from multiple hourly entries", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-05:00", temperature: 50 },
          { startTime: "2025-11-22T09:00:00-05:00", temperature: 60 },
          { startTime: "2025-11-22T12:00:00-05:00", temperature: 75 },
          { startTime: "2025-11-22T15:00:00-05:00", temperature: 70 },
          { startTime: "2025-11-22T18:00:00-05:00", temperature: 55 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(50);
      expect(result.maxTemp).toBe(75);
    });

    it("should only include hourly data from the specified day", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-21T18:00:00-05:00", temperature: 40 }, // Previous day
          { startTime: "2025-11-22T06:00:00-05:00", temperature: 50 },
          { startTime: "2025-11-22T12:00:00-05:00", temperature: 75 },
          { startTime: "2025-11-22T18:00:00-05:00", temperature: 55 },
          { startTime: "2025-11-23T06:00:00-05:00", temperature: 45 } // Next day
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(50);
      expect(result.maxTemp).toBe(75);
    });

    it("should handle string temperatures", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T10:00:00-05:00", temperature: "65" },
          { startTime: "2025-11-22T14:00:00-05:00", temperature: "75" }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(65);
      expect(result.maxTemp).toBe(75);
    });

    it("should skip entries with invalid temperatures", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-05:00", temperature: 50 },
          { startTime: "2025-11-22T09:00:00-05:00", temperature: "invalid" },
          { startTime: "2025-11-22T12:00:00-05:00", temperature: NaN },
          { startTime: "2025-11-22T15:00:00-05:00", temperature: 70 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(50);
      expect(result.maxTemp).toBe(70);
    });

    it("should skip entries with missing or invalid startTime", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-05:00", temperature: 50 },
          { startTime: null, temperature: 60 },
          { startTime: "invalid-date", temperature: 65 },
          { temperature: 70 }, // Missing startTime
          { startTime: "2025-11-22T15:00:00-05:00", temperature: 80 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(50);
      expect(result.maxTemp).toBe(80);
    });

    it("should handle negative temperatures", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-05:00", temperature: -10 },
          { startTime: "2025-11-22T12:00:00-05:00", temperature: 5 },
          { startTime: "2025-11-22T18:00:00-05:00", temperature: -5 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(-10);
      expect(result.maxTemp).toBe(5);
    });

    it("should handle decimal temperatures", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-05:00", temperature: 50.5 },
          { startTime: "2025-11-22T12:00:00-05:00", temperature: 75.8 },
          { startTime: "2025-11-22T18:00:00-05:00", temperature: 55.2 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-05:00"
      );

      expect(result.minTemp).toBe(50.5);
      expect(result.maxTemp).toBe(75.8);
    });

    it("should handle different timezones", () => {
      module.weatherData = {
        hourly: [
          { startTime: "2025-11-22T06:00:00-08:00", temperature: 50 },
          { startTime: "2025-11-22T12:00:00-08:00", temperature: 75 },
          { startTime: "2025-11-22T18:00:00-08:00", temperature: 55 }
        ]
      };
      const result = module.calculateDailyMinMaxFromHourly(
        "2025-11-22T06:00:00-08:00"
      );

      expect(result.minTemp).toBe(50);
      expect(result.maxTemp).toBe(75);
    });
  });

  describe("preProcessWeatherData - daily min/max integration", () => {
    it("should use hourly data when available", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          },
          {
            startTime: "2025-11-22T18:00:00-05:00",
            temperature: 55,
            temperatureUnit: "F",
            relativeHumidity: { value: 70 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {}
      };

      module.preProcessWeatherData();

      expect(module.weatherData.daily[0].maxTemperature).toBe("75");
      expect(module.weatherData.daily[0].minTemperature).toBe("50");
    });

    it("should fallback to grid data when hourly data not available", () => {
      module.weatherData = {
        hourly: [],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 80 }
            ],
            uom: "wmoUnit:degF"
          },
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // Grid data values should now be consistently converted to strings
      expect(module.weatherData.daily[0].maxTemperature).toBe("80");
      expect(module.weatherData.daily[0].minTemperature).toBe("45");
    });

    it("should use max of hourly and grid data for maximum temperature", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 80 }
            ],
            uom: "wmoUnit:degF"
          },
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // Should use 80 from grid (max of 75 from hourly and 80 from grid)
      expect(module.weatherData.daily[0].maxTemperature).toBe("80");
      // Should use 45 from grid (min of 50 from hourly and 45 from grid)
      expect(module.weatherData.daily[0].minTemperature).toBe("45");
    });

    it("should use min of hourly and grid data for minimum temperature", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 40,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 85,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 80 }
            ],
            uom: "wmoUnit:degF"
          },
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // Should use 85 from hourly (max of 85 from hourly and 80 from grid)
      expect(module.weatherData.daily[0].maxTemperature).toBe("85");
      // Should use 40 from hourly (min of 40 from hourly and 45 from grid)
      expect(module.weatherData.daily[0].minTemperature).toBe("40");
    });

    it("should handle grid data with undefined values", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {
          maxTemperature: {
            values: [],
            uom: "wmoUnit:degF"
          },
          minTemperature: {
            values: [],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // Should use hourly data only
      expect(module.weatherData.daily[0].maxTemperature).toBe("75");
      expect(module.weatherData.daily[0].minTemperature).toBe("50");
    });

    it("should convert temperatures based on config units", () => {
      module.config.units = "metric";
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 32,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 68,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F"
          }
        ],
        grid: {}
      };

      module.preProcessWeatherData();

      // Temperatures should be converted from F to C
      expect(parseFloat(module.weatherData.daily[0].maxTemperature)).toBe(20);
      expect(parseFloat(module.weatherData.daily[0].minTemperature)).toBe(0);
    });

    it("should handle multiple days in daily array", () => {
      // Use current hour to ensure hourly data isn't trimmed by preProcessWeatherData
      const currentHour = moment().startOf("hour");
      const nextHour = currentHour.clone().add(1, "hour");
      const tomorrow = moment().add(1, "day").startOf("day");

      module.config.units = "imperial";
      module.weatherData = {
        hourly: [
          {
            startTime: currentHour.format(),
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: nextHour.format(),
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          },
          {
            startTime: tomorrow.clone().add(currentHour.hour(), "hours").format(),
            temperature: 45,
            temperatureUnit: "F",
            relativeHumidity: { value: 65 }
          },
          {
            startTime: tomorrow.clone().add(nextHour.hour(), "hours").format(),
            temperature: 70,
            temperatureUnit: "F",
            relativeHumidity: { value: 55 }
          }
        ],
        daily: [
          {
            startTime: currentHour.format(),
            temperature: 65,
            temperatureUnit: "F"
          },
          {
            startTime: tomorrow.format(),
            temperature: 60,
            temperatureUnit: "F"
          }
        ],
        grid: {}
      };

      module.preProcessWeatherData();

      // First day
      expect(module.weatherData.daily[0].maxTemperature).toBe("75");
      expect(module.weatherData.daily[0].minTemperature).toBe("50");
      // Second day
      expect(module.weatherData.daily[1].maxTemperature).toBe("70");
      expect(module.weatherData.daily[1].minTemperature).toBe("45");
    });

    it("should handle missing grid data gracefully", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: null
      };

      module.preProcessWeatherData();

      expect(module.weatherData.daily[0].maxTemperature).toBe("75");
      expect(module.weatherData.daily[0].minTemperature).toBe("50");
    });

    it("should handle NaN values from grid data", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          },
          {
            startTime: "2025-11-22T12:00:00-05:00",
            temperature: 75,
            temperatureUnit: "F",
            relativeHumidity: { value: 50 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          }
        ],
        grid: {
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: "invalid" }
            ],
            uom: "wmoUnit:degF"
          },
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: "invalid" }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // Should use hourly data when grid data is invalid
      expect(module.weatherData.daily[0].maxTemperature).toBe("75");
      expect(module.weatherData.daily[0].minTemperature).toBe("50");
    });

    it("should preserve other daily properties", () => {
      module.weatherData = {
        hourly: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 50,
            temperatureUnit: "F",
            relativeHumidity: { value: 60 }
          }
        ],
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F",
            icon: "test-icon",
            shortForecast: "Partly Cloudy"
          }
        ],
        grid: {
          iceAccumulation: { values: [], uom: "wmoUnit:mm" },
          quantitativePrecipitation: { values: [], uom: "wmoUnit:mm" }
        }
      };

      module.preProcessWeatherData();

      expect(module.weatherData.daily[0].icon).toBe("test-icon");
      expect(module.weatherData.daily[0].shortForecast).toBe("Partly Cloudy");
    });
  });
});
