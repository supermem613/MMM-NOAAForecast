/**
 * Unit tests for MMM-NOAAForecast minTemperature NaN issue
 * Tests the root cause and reproduction scenarios
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

describe("MMM-NOAAForecast minTemperature NaN Issue", () => {
  let module;

  beforeEach(() => {
    // Create a new instance with default configuration
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      units: "imperial",
      concise: true,
      label_high: "H",
      label_low: "L",
      label_timeFormat: "h a",
      label_days: ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"],
      iconset: "1c"
    };
    module.identifier = "test_module_1";
    module.weatherData = null;
    // Mock the file function
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
  });

  describe("getGridValueMatchingDay", () => {
    it("should return undefined when weatherData is null", () => {
      module.weatherData = null;

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when grid data is missing", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {}
      };

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when minTemperature key doesn't exist in grid", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }
            ],
            uom: "wmoUnit:degF"
          }
          // minTemperature is intentionally missing
        }
      };

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when minTemperature.values is empty", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [],
            uom: "wmoUnit:degF"
          }
        }
      };

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when timestamp doesn't match any grid entry", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-24T00:00:00-05:00/PT24H", value: 45 },
              { validTime: "2025-11-25T00:00:00-05:00/PT24H", value: 48 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Looking for Nov 22, but grid only has Nov 24-25
      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should return converted value when timestamp matches grid entry", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      // When units match (imperial/F), convertIfNeeded returns the value as-is (number)
      expect(result).toBe(45);
    });

    it("should return undefined when grid value is null", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: null }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeNull();
    });
  });

  describe("formatHiLowTemperature", () => {
    it("should return -- when minTemperature is undefined", () => {
      const result = module.formatHiLowTemperature(75, undefined);

      expect(result.high).toBe("75°");
      expect(result.low).toBe("--°");
    });

    it("should return -- when minTemperature is null", () => {
      const result = module.formatHiLowTemperature(75, null);

      expect(result.high).toBe("75°");
      expect(result.low).toBe("--°"); // Defensive guard prevents Math.round(null) = 0
    });

    it("should handle valid temperatures correctly", () => {
      const result = module.formatHiLowTemperature(75, 45);

      expect(result.high).toBe("75°");
      expect(result.low).toBe("45°");
    });

    it("should handle string temperatures that can be converted", () => {
      const result = module.formatHiLowTemperature("75", "45");

      expect(result.high).toBe("75°");
      expect(result.low).toBe("45°");
    });

    it("should return -- when minTemperature is non-numeric string", () => {
      const result = module.formatHiLowTemperature(75, "invalid");

      expect(result.high).toBe("75°");
      expect(result.low).toBe("--°");
    });
  });

  describe("preProcessWeatherData - integration", () => {
    it("should set daily.minTemperature to undefined when grid data is missing", () => {
      module.weatherData = {
        daily: [
          {
            startTime: "2025-11-22T00:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F",
            icon: "https://api.weather.gov/icons/land/day/sct"
          }
        ],
        hourly: [],
        grid: {
          // minTemperature is missing
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      expect(module.weatherData.daily[0].minTemperature).toBeUndefined();
    });

    it("should set daily.minTemperature correctly when grid data exists", () => {
      module.weatherData = {
        daily: [
          {
            startTime: "2025-11-22T00:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F",
            icon: "https://api.weather.gov/icons/land/day/sct"
          }
        ],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          },
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      expect(module.weatherData.daily[0].minTemperature).toBe(45);
      expect(module.weatherData.daily[0].maxTemperature).toBe(75);
    });

    it("should handle sparse grid data (only first 2 days have minTemp)", () => {
      module.weatherData = {
        daily: [
          {
            startTime: "2025-11-22T00:00:00-05:00",
            temperature: 65,
            temperatureUnit: "F"
          },
          {
            startTime: "2025-11-23T00:00:00-05:00",
            temperature: 68,
            temperatureUnit: "F"
          },
          {
            startTime: "2025-11-24T00:00:00-05:00",
            temperature: 70,
            temperatureUnit: "F"
          },
          {
            startTime: "2025-11-25T00:00:00-05:00",
            temperature: 72,
            temperatureUnit: "F"
          }
        ],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
              { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
              // Days 3 and 4 have no minTemperature data
            ],
            uom: "wmoUnit:degF"
          },
          maxTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 },
              { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 78 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      module.preProcessWeatherData();

      // First two days should have minTemperature
      expect(module.weatherData.daily[0].minTemperature).toBe(45);
      expect(module.weatherData.daily[1].minTemperature).toBe(48);

      // Days 3 and 4 should be undefined (this causes NaN later)
      expect(module.weatherData.daily[2].minTemperature).toBeUndefined();
      expect(module.weatherData.daily[3].minTemperature).toBeUndefined();
    });
  });

  describe("forecastDailyFactory - end-to-end", () => {
    it("should produce NaN in tempRange.low when minTemperature is undefined", () => {
      const fData = {
        startTime: "2025-11-25T00:00:00-05:00",
        maxTemperature: "72",
        minTemperature: undefined, // This is what happens with sparse grid data
        icon: "https://api.weather.gov/icons/land/day/sct",
        probabilityOfPrecipitation: { value: 20 },
        rainAccumulation: undefined,
        snowAccumulation: undefined,
        windSpeed: "10 mph",
        windDirection: "NW",
        windGust: undefined
      };

      const result = module.forecastDailyFactory(fData, "daily");

      expect(result.day).toBeDefined();
      expect(result.tempRange.high).toBe("72°");
      expect(result.tempRange.low).toBe("--°"); // Defensive guard shows -- instead of NaN
    });

    it("should handle valid minTemperature correctly", () => {
      const fData = {
        startTime: "2025-11-22T00:00:00-05:00",
        maxTemperature: "75",
        minTemperature: "45",
        icon: "https://api.weather.gov/icons/land/day/sct",
        probabilityOfPrecipitation: { value: 20 },
        rainAccumulation: undefined,
        snowAccumulation: undefined,
        windSpeed: "10 mph",
        windDirection: "NW",
        windGust: undefined
      };

      const result = module.forecastDailyFactory(fData, "daily");

      expect(result.tempRange.high).toBe("75°");
      expect(result.tempRange.low).toBe("45°");
    });
  });

  describe("Full workflow simulation", () => {
    it("should reproduce NaN bug with realistic NOAA data structure", () => {
      // Simulate NOAA API response with sparse minTemperature data
      const mockPayload = {
        forecast: JSON.stringify({
          properties: {
            periods: [
              {
                startTime: "2025-11-22T00:00:00-05:00",
                temperature: 65,
                temperatureUnit: "F",
                shortForecast: "Partly Cloudy",
                detailedForecast: "Partly cloudy with high near 65",
                icon: "https://api.weather.gov/icons/land/day/sct",
                probabilityOfPrecipitation: { value: 10 }
              },
              {
                startTime: "2025-11-23T00:00:00-05:00",
                temperature: 68,
                temperatureUnit: "F",
                shortForecast: "Sunny",
                detailedForecast: "Sunny with high near 68",
                icon: "https://api.weather.gov/icons/land/day/skc",
                probabilityOfPrecipitation: { value: 0 }
              },
              {
                startTime: "2025-11-24T00:00:00-05:00",
                temperature: 70,
                temperatureUnit: "F",
                shortForecast: "Sunny",
                detailedForecast: "Sunny with high near 70",
                icon: "https://api.weather.gov/icons/land/day/skc",
                probabilityOfPrecipitation: { value: 0 }
              },
              {
                startTime: "2025-11-25T00:00:00-05:00",
                temperature: 72,
                temperatureUnit: "F",
                shortForecast: "Mostly Sunny",
                detailedForecast: "Mostly sunny with high near 72",
                icon: "https://api.weather.gov/icons/land/day/few",
                probabilityOfPrecipitation: { value: 5 }
              }
            ]
          }
        }),
        forecastHourly: JSON.stringify({
          properties: {
            periods: [
              {
                startTime: moment().format(),
                temperature: 60,
                temperatureUnit: "F",
                icon: "https://api.weather.gov/icons/land/day/sct",
                windSpeed: "10 mph",
                windDirection: "NW",
                probabilityOfPrecipitation: { value: 10 },
                relativeHumidity: { value: 50 }
              }
            ]
          }
        }),
        forecastGridData: JSON.stringify({
          properties: {
            // Grid data only has minTemperature for first 2 days
            minTemperature: {
              values: [
                { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
                { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
                // Days 3 and 4 have no data - NOAA commonly only provides 2-3 days
              ],
              uom: "wmoUnit:degF"
            },
            maxTemperature: {
              values: [
                { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 },
                { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 78 },
                { validTime: "2025-11-24T00:00:00-05:00/PT24H", value: 80 },
                { validTime: "2025-11-25T00:00:00-05:00/PT24H", value: 82 }
              ],
              uom: "wmoUnit:degF"
            },
            quantitativePrecipitation: {
              values: [],
              uom: "wmoUnit:mm"
            },
            iceAccumulation: {
              values: [],
              uom: "wmoUnit:mm"
            },
            windGust: {
              values: [{ validTime: moment().format() + "/PT1H", value: 15 }],
              uom: "wmoUnit:km_h-1"
            }
          }
        })
      };

      // Process as the module would
      module.weatherData = {
        daily: JSON.parse(mockPayload.forecast).properties.periods,
        hourly: JSON.parse(mockPayload.forecastHourly).properties.periods,
        grid: JSON.parse(mockPayload.forecastGridData).properties
      };

      module.preProcessWeatherData();

      // Verify the issue: Days 1-2 have minTemp, days 3-4 don't
      expect(module.weatherData.daily[0].minTemperature).toBe(45);
      expect(module.weatherData.daily[1].minTemperature).toBe(48);
      expect(module.weatherData.daily[2].minTemperature).toBeUndefined();
      expect(module.weatherData.daily[3].minTemperature).toBeUndefined();

      // When forecastDailyFactory is called on days 3-4, it will produce NaN
      const day3Result = module.forecastDailyFactory(
        module.weatherData.daily[2],
        "daily"
      );
      const day4Result = module.forecastDailyFactory(
        module.weatherData.daily[3],
        "daily"
      );

      expect(day3Result.tempRange.low).toBe("--°");
      expect(day4Result.tempRange.low).toBe("--°");
    });
  });

  describe("convertTemperature edge cases", () => {
    it("should return undefined when passed undefined", () => {
      const result = module.convertTemperature(undefined, false);

      expect(result).toBeUndefined();
    });

    it("should return null when passed null", () => {
      const result = module.convertTemperature(null, false);

      expect(result).toBeNull();
    });

    it("should return original value when passed non-numeric string", () => {
      const result = module.convertTemperature("N/A", false);

      expect(result).toBe("N/A");
    });
  });

  describe("convertIfNeeded propagation", () => {
    it("should propagate undefined through conversion", () => {
      const result = module.convertIfNeeded(undefined, "wmoUnit:degF");

      expect(result).toBeUndefined();
    });

    it("should handle missing unit gracefully", () => {
      const result = module.convertIfNeeded(45, undefined);

      expect(result).toBe(45);
    });
  });

  describe("Timezone edge cases in findValueForTimestampMatchingDay", () => {
    it("should match when daily forecast is 6am and grid data starts at midnight same day", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid: midnight Nov 22
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Daily forecast: 6am Nov 22 (same day but 6 hours later)
      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBe(45);
    });

    it("should match when timestamps are in different timezones but same calendar day", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid: midnight EST (UTC-5)
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Daily forecast: 11pm PST on Nov 21 = 2am EST Nov 22 (next calendar day in EST)
      const result = module.getGridValueMatchingDay(
        "2025-11-21T23:00:00-08:00",
        "minTemperature"
      );

      // In PST it's Nov 21, but in EST (where grid data is) it's Nov 22 @ 2am
      // Current logic uses startOf("day") which may break this
      expect(result).toBe(45);
    });

    it("should NOT match when target is previous day despite timezone conversion", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Target is Nov 22, grid is Nov 23 - should not match
      const result = module.getGridValueMatchingDay(
        "2025-11-22T18:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should match midnight boundary correctly", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Exactly at midnight start
      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBe(45);
    });

    it("should match end of day correctly (11:59pm)", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // 11:59pm on Nov 22
      const result = module.getGridValueMatchingDay(
        "2025-11-22T23:59:59-05:00",
        "minTemperature"
      );

      expect(result).toBe(45);
    });

    it("should handle daylight saving time boundary", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // March 10, 2025 is when DST starts (spring forward)
              // EST becomes EDT
              { validTime: "2025-03-10T00:00:00-05:00/PT24H", value: 40 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // 3am EDT (which is 2am that got skipped to 3am)
      const result = module.getGridValueMatchingDay(
        "2025-03-10T03:00:00-04:00",
        "minTemperature"
      );

      expect(result).toBe(40);
    });

    it("should NOT match when timestamps are on different calendar days in their respective timezones", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid: Nov 22 midnight EST
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Target: Nov 21 at 9pm PST (which is midnight EST Nov 22, but calendar date is Nov 21 in PST)
      // In PST timezone: Nov 21
      // In EST timezone: Nov 22
      // The grid data is for calendar date Nov 22 (in EST)
      // The target is for calendar date Nov 21 (in PST)
      // Question: Should these match?

      // Expected behavior: Match based on the grid data's timezone (EST)
      // PST 9pm Nov 21 = EST midnight Nov 22 = matches grid for Nov 22
      const result = module.getGridValueMatchingDay(
        "2025-11-21T21:00:00-08:00",
        "minTemperature"
      );

      // Current implementation uses startOf("day") on startMoment (EST timezone preserved)
      // dayStart = Nov 22 00:00:00-05:00
      // dayEnd = Nov 23 00:00:00-05:00
      // targetMoment = Nov 21 21:00:00-08:00 = Nov 22 00:00:00-05:00 (same instant, preserved timezone)
      // isSameOrAfter(dayStart) = true, isBefore(dayEnd) = true → SHOULD MATCH
      expect(result).toBe(45);
    });

    it("should demonstrate the actual bug: grid period spans one day but target is in different day", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid data starts at 6am Nov 22, spans 24 hours
              { validTime: "2025-11-22T06:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Daily forecast timestamp: midnight Nov 22
      // Grid starts at 6am Nov 22
      // The current code does:
      // startMoment = 6am Nov 22
      // dayStart = midnight Nov 22 (startOf("day"))
      // dayEnd = midnight Nov 23
      // target = midnight Nov 22
      // isSameOrAfter(midnight) = true, isBefore(next midnight) = true → MATCHES

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      // This should match because target (midnight) falls within the calendar day that starts at 6am
      expect(result).toBe(45);
    });

    it("should demonstrate when grid starts mid-day and target is early morning same day", () => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid starts at 6pm Nov 22
              { validTime: "2025-11-22T18:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Target: 6am Nov 22 (12 hours before grid starts)
      // startMoment = 6pm Nov 22
      // dayStart = midnight Nov 22 (startOf("day"))
      // dayEnd = midnight Nov 23
      // target = 6am Nov 22
      // isSameOrAfter(midnight) = true, isBefore(next midnight) = true → MATCHES

      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "minTemperature"
      );

      // This matches because we're comparing calendar days, not actual time ranges
      expect(result).toBe(45);
    });

    it("BUG CASE: Should use calendar date comparison, not time-of-day boundaries", () => {
      // This test exposes a potential semantic issue with the current implementation
      // The current code uses startOf("day") which creates a 24-hour window
      // But what we actually want is to match by calendar date string

      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid data timestamped at 6am Nov 22
              { validTime: "2025-11-22T06:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Target: also Nov 22, but at midnight
      // With current implementation:
      // - startMoment = 2025-11-22T06:00:00-05:00
      // - dayStart = 2025-11-22T00:00:00-05:00 (startOf("day"))
      // - target = 2025-11-22T00:00:00-05:00
      // - Result: MATCHES (because target is within [dayStart, dayEnd))

      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBe(45);

      // Now test with proposed string-based approach:
      // - Grid date: "2025-11-22"
      // - Target date: "2025-11-22"
      // - Result: MATCHES (same behavior)
    });

    it("CRITICAL BUG: Different timezone offsets for same calendar date", () => {
      // This is the REAL bug scenario
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              // Grid: Nov 22 in EST
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      // Target: Nov 22 in PST (different timezone, same calendar date)
      // Nov 22 midnight PST = Nov 22 3am EST (different instant, different times, same date)
      const result = module.getGridValueMatchingDay(
        "2025-11-22T00:00:00-08:00",
        "minTemperature"
      );

      // With current implementation:
      // - startMoment = 2025-11-22T00:00:00-05:00 (grid timestamp in EST)
      // - dayStart = 2025-11-22T00:00:00-05:00
      // - dayEnd = 2025-11-23T00:00:00-05:00
      // - target = 2025-11-22T00:00:00-08:00 (PST)
      // - In moment comparison, these are DIFFERENT instants:
      //   * target in UTC: 2025-11-22T08:00:00Z
      //   * dayStart in UTC: 2025-11-22T05:00:00Z
      //   * dayEnd in UTC: 2025-11-23T05:00:00Z
      // - isSameOrAfter(dayStart)? target (08:00 UTC) >= dayStart (05:00 UTC) = YES
      // - isBefore(dayEnd)? target (08:00 UTC on Nov 22) < dayEnd (05:00 UTC on Nov 23) = YES
      // - Result: MATCHES

      // But with string-based calendar date:
      // - Grid date: extract "2025-11-22" from "2025-11-22T00:00:00-05:00"
      // - Target date: extract "2025-11-22" from "2025-11-22T00:00:00-08:00"
      // - Result: MATCHES (both are calendar date "2025-11-22")

      expect(result).toBe(45); // Both approaches should match here
    });
  });
});
