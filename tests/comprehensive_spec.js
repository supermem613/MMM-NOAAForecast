/**
 * Comprehensive unit tests for MMM-NOAAForecast module
 * Tests all major functions and edge cases
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

describe("MMM-NOAAForecast Comprehensive Tests", () => {
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
      label_gust: "max",
      iconset: "1c",
      mainIconset: "1c",
      useAnimatedIcons: false,
      animateMainIconOnly: true
    };
    module.identifier = "test_module_comprehensive";
    module.weatherData = null;
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
  });

  // ============================================================================
  // Temperature Conversion Tests
  // ============================================================================
  describe("convertTemperature", () => {
    beforeEach(() => {
      module.config.units = "imperial";
    });

    it("should convert Fahrenheit to Celsius", () => {
      module.config.units = "metric";
      const result = module.convertTemperature(32, true);
      expect(result).toBe("0");
    });

    it("should convert Celsius to Fahrenheit", () => {
      const result = module.convertTemperature(0, false);
      expect(result).toBe("32");
    });

    it("should handle freezing point correctly", () => {
      module.config.units = "metric";
      expect(module.convertTemperature(32, true)).toBe("0");
    });

    it("should handle boiling point correctly", () => {
      module.config.units = "metric";
      expect(module.convertTemperature(212, true)).toBe("100");
    });

    it("should round to 1 decimal for Fahrenheit to Celsius", () => {
      module.config.units = "metric";
      const result = module.convertTemperature(75, true);
      expect(result).toBe("23.9");
    });

    it("should round to integer for Celsius to Fahrenheit", () => {
      const result = module.convertTemperature(23.9, false);
      expect(result).toBe("75");
    });

    it("should handle negative temperatures", () => {
      module.config.units = "metric";
      expect(module.convertTemperature(-40, true)).toBe("-40");
    });

    it("should return undefined when passed undefined", () => {
      expect(module.convertTemperature(undefined, true)).toBeUndefined();
    });

    it("should return null when passed null", () => {
      expect(module.convertTemperature(null, true)).toBeNull();
    });

    it("should return original value for non-numeric input", () => {
      expect(module.convertTemperature("invalid", true)).toBe("invalid");
    });
  });

  // ============================================================================
  // Distance Conversion Tests
  // ============================================================================
  describe("convertDistance", () => {
    it("should convert mm to inches", () => {
      const result = module.convertDistance(25.4, true);
      expect(result).toBe("1");
    });

    it("should convert inches to mm", () => {
      const result = module.convertDistance(1, false);
      expect(result).toBe("25.4");
    });

    it("should round to 2 decimal places", () => {
      const result = module.convertDistance(2.5, true);
      expect(result).toBe("0.1");
    });

    it("should handle zero", () => {
      expect(module.convertDistance(0, true)).toBe("0");
    });

    it("should return undefined for undefined input", () => {
      expect(module.convertDistance(undefined, true)).toBeUndefined();
    });

    it("should return null for null input", () => {
      expect(module.convertDistance(null, true)).toBeNull();
    });

    it("should return NaN for non-numeric string", () => {
      const result = module.convertDistance("invalid", true);
      expect(isNaN(result)).toBe(true);
    });
  });

  // ============================================================================
  // Speed Conversion Tests
  // ============================================================================
  describe("convertSpeed", () => {
    it("should convert km/h to mph", () => {
      const result = module.convertSpeed(100, true);
      expect(result).toBe("62");
    });

    it("should convert mph to km/h", () => {
      const result = module.convertSpeed(62, false);
      expect(result).toBe("100");
    });

    it("should round to integer", () => {
      const result = module.convertSpeed(62.5, false);
      expect(result).toBe("101");
    });

    it("should handle zero", () => {
      expect(module.convertSpeed(0, true)).toBe("0");
    });

    it("should return undefined for undefined input", () => {
      expect(module.convertSpeed(undefined, true)).toBeUndefined();
    });

    it("should return null for null input", () => {
      expect(module.convertSpeed(null, true)).toBeNull();
    });
  });

  // ============================================================================
  // convertIfNeeded Tests
  // ============================================================================
  describe("convertIfNeeded", () => {
    it("should convert wmoUnit:degC to F when units=imperial", () => {
      module.config.units = "imperial";
      const result = module.convertIfNeeded(0, "wmoUnit:degC");
      expect(result).toBe("32");
    });

    it("should convert wmoUnit:degF to C when units=metric", () => {
      module.config.units = "metric";
      const result = module.convertIfNeeded(32, "wmoUnit:degF");
      expect(result).toBe("0");
    });

    it("should convert wmoUnit:mm to inches when units=imperial", () => {
      module.config.units = "imperial";
      const result = module.convertIfNeeded(25.4, "wmoUnit:mm");
      expect(result).toBe("1");
    });

    it("should convert wmoUnit:in to mm when units=metric", () => {
      module.config.units = "metric";
      const result = module.convertIfNeeded(1, "wmoUnit:in");
      expect(result).toBe("25.4");
    });

    it("should convert wmoUnit:km_h-1 when units=imperial", () => {
      module.config.units = "imperial";
      const result = module.convertIfNeeded(100, "wmoUnit:km_h-1");
      expect(result).toBe("62");
    });

    it("should not convert when units match", () => {
      module.config.units = "imperial";
      const result = module.convertIfNeeded(75, "wmoUnit:degF");
      expect(result).toBe(75);
    });

    it("should handle undefined value", () => {
      expect(module.convertIfNeeded(undefined, "wmoUnit:degF")).toBeUndefined();
    });
  });

  // ============================================================================
  // calculateFeelsLike Tests
  // ============================================================================
  describe("calculateFeelsLike", () => {
    beforeEach(() => {
      module.config.units = "imperial";
    });

    it("should return same temperature when no wind chill or heat index applies", () => {
      const result = module.calculateFeelsLike(70, 5, 50);
      expect(result).toBe(70);
    });

    it("should calculate wind chill when temp ≤ 50°F and wind ≥ 3mph", () => {
      const result = module.calculateFeelsLike(40, 15, 50);
      expect(result).toBeLessThan(40);
    });

    it("should calculate heat index when temp ≥ 80°F and humidity ≥ 40%", () => {
      const result = module.calculateFeelsLike(90, 5, 60);
      expect(result).toBeGreaterThan(90);
    });

    it("should handle metric units for wind chill", () => {
      module.config.units = "metric";
      // 5°C, 25 km/h wind
      const result = module.calculateFeelsLike(5, 25, 50);
      expect(result).toBeLessThan(5);
    });

    it("should handle metric units for heat index", () => {
      module.config.units = "metric";
      // 30°C (86°F), 60% humidity
      const result = module.calculateFeelsLike(30, 5, 60);
      expect(result).toBeGreaterThan(30);
    });

    it("should handle non-numeric temperature gracefully", () => {
      const result = module.calculateFeelsLike("invalid", 10, 50);
      expect(result).toBe("invalid");
    });

    it("should default wind to 0 if NaN", () => {
      const result = module.calculateFeelsLike(70, "invalid", 50);
      expect(result).toBe(70);
    });

    it("should default humidity to 50 if NaN", () => {
      const result = module.calculateFeelsLike(90, 5, "invalid");
      // Should still calculate heat index with default 50% humidity
      expect(typeof result).toBe("number");
    });
  });

  // ============================================================================
  // accumulateValueForTimestamp Tests
  // ============================================================================
  describe("accumulateValueForTimestamp", () => {
    it("should accumulate values for matching day", () => {
      const data = [
        {
          validTime: "2025-11-22T00:00:00-05:00/PT1H",
          value: 0.1
        },
        {
          validTime: "2025-11-22T06:00:00-05:00/PT1H",
          value: 0.2
        },
        {
          validTime: "2025-11-22T12:00:00-05:00/PT1H",
          value: 0.3
        }
      ];

      const result = module.accumulateValueForTimestamp(
        "2025-11-22T08:00:00-05:00",
        data
      );

      expect(result).toBeCloseTo(0.6, 10);
    });

    it("should return undefined when no matching entries", () => {
      const data = [
        {
          validTime: "2025-11-23T00:00:00-05:00/PT1H",
          value: 0.1
        }
      ];

      const result = module.accumulateValueForTimestamp(
        "2025-11-22T08:00:00-05:00",
        data
      );

      expect(result).toBeUndefined();
    });

    it("should skip entries with null values", () => {
      const data = [
        {
          validTime: "2025-11-22T00:00:00-05:00/PT1H",
          value: 0.1
        },
        {
          validTime: "2025-11-22T06:00:00-05:00/PT1H",
          value: null
        },
        {
          validTime: "2025-11-22T12:00:00-05:00/PT1H",
          value: 0.3
        }
      ];

      const result = module.accumulateValueForTimestamp(
        "2025-11-22T08:00:00-05:00",
        data
      );

      expect(result).toBe(0.4);
    });

    it("should return undefined for invalid timestamp", () => {
      const data = [
        { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0.1 }
      ];
      const result = module.accumulateValueForTimestamp("invalid", data);
      expect(result).toBeUndefined();
    });

    it("should return undefined for null array", () => {
      const result = module.accumulateValueForTimestamp(
        "2025-11-22T08:00:00-05:00",
        null
      );
      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // findValueForTimestamp Tests
  // ============================================================================
  describe("findValueForTimestamp", () => {
    it("should find value when timestamp falls within duration", () => {
      const data = [
        {
          validTime: "2025-11-22T06:00:00-05:00/PT3H",
          value: 65
        }
      ];

      const result = module.findValueForTimestamp(
        "2025-11-22T07:00:00-05:00",
        data
      );

      expect(result).toBe(65);
    });

    it("should return undefined when timestamp is outside duration", () => {
      const data = [
        {
          validTime: "2025-11-22T06:00:00-05:00/PT3H",
          value: 65
        }
      ];

      const result = module.findValueForTimestamp(
        "2025-11-22T10:00:00-05:00",
        data
      );

      expect(result).toBeUndefined();
    });

    it("should match at exact start time", () => {
      const data = [
        {
          validTime: "2025-11-22T06:00:00-05:00/PT3H",
          value: 65
        }
      ];

      const result = module.findValueForTimestamp(
        "2025-11-22T06:00:00-05:00",
        data
      );

      expect(result).toBe(65);
    });

    it("should not match at exact end time", () => {
      const data = [
        {
          validTime: "2025-11-22T06:00:00-05:00/PT3H",
          value: 65
        }
      ];

      const result = module.findValueForTimestamp(
        "2025-11-22T09:00:00-05:00",
        data
      );

      expect(result).toBeUndefined();
    });

    it("should handle multiple entries and find first match", () => {
      const data = [
        {
          validTime: "2025-11-22T00:00:00-05:00/PT6H",
          value: 60
        },
        {
          validTime: "2025-11-22T06:00:00-05:00/PT6H",
          value: 65
        },
        {
          validTime: "2025-11-22T12:00:00-05:00/PT6H",
          value: 70
        }
      ];

      const result = module.findValueForTimestamp(
        "2025-11-22T08:00:00-05:00",
        data
      );

      expect(result).toBe(65);
    });

    it("should return undefined for invalid timestamp", () => {
      const data = [{ validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }];
      const result = module.findValueForTimestamp("invalid", data);
      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // formatPrecipitation Tests
  // ============================================================================
  describe("formatPrecipitation", () => {
    beforeEach(() => {
      module.config.units = "imperial";
    });

    it("should format precipitation with percent chance only", () => {
      const result = module.formatPrecipitation(40, null, null);

      expect(result.pop).toBe("40%");
      expect(result.accumulation).toBeNull();
      expect(result.accumulationType).toBeNull();
    });

    it("should format rain accumulation", () => {
      const result = module.formatPrecipitation(80, "0.5", null);

      expect(result.pop).toBe("80%");
      expect(result.accumulation).toBe("0.5 in");
      expect(result.accumulationType).toBe("rain");
    });

    it("should format snow accumulation", () => {
      const result = module.formatPrecipitation(90, null, "3");

      expect(result.pop).toBe("90%");
      expect(result.accumulation).toBe("3 in");
      expect(result.accumulationType).toBe("snow");
    });

    it("should prefer snow over rain when both present", () => {
      const result = module.formatPrecipitation(90, "0.5", "2");

      expect(result.accumulationType).toBe("snow");
      expect(result.accumulation).toBe("2 in");
    });

    it("should use mm for metric units", () => {
      module.config.units = "metric";
      const result = module.formatPrecipitation(80, "12.7", null);

      expect(result.accumulation).toBe("12.7 mm");
    });

    it("should ignore zero accumulation", () => {
      const result = module.formatPrecipitation(40, "0", "0");

      expect(result.accumulation).toBeNull();
      expect(result.accumulationType).toBeNull();
    });

    it("should handle null percent chance", () => {
      const result = module.formatPrecipitation(null, "0.5", null);

      expect(result.pop).toBe("null%");
    });
  });

  // ============================================================================
  // formatWind Tests
  // ============================================================================
  describe("formatWind", () => {
    beforeEach(() => {
      module.config.units = "imperial";
      module.config.concise = true;
      module.config.label_gust = "max";
    });

    it("should format wind speed without direction in concise mode", () => {
      const result = module.formatWind("10", "NW", null);

      expect(result.windSpeed).toBe("10 ");
      expect(result.windGust).toBeNull();
    });

    it("should format wind with direction in verbose mode", () => {
      module.config.concise = false;
      const result = module.formatWind("10", "NW", null);

      expect(result.windSpeed).toBe("10 NW");
    });

    it("should include gust in verbose mode", () => {
      module.config.concise = false;
      const result = module.formatWind("10", "NW", "15");

      expect(result.windSpeed).toBe("10 NW");
      expect(result.windGust).toBe(" (max 15 mph)");
    });

    it("should not include gust in concise mode", () => {
      const result = module.formatWind("10", "NW", "15");

      expect(result.windGust).toBeNull();
    });

    it("should use km/h for metric units", () => {
      module.config.units = "metric";
      module.config.concise = false;
      const result = module.formatWind("10", "NW", "15");

      expect(result.windGust).toBe(" (max 15 km/h)");
    });
  });

  // ============================================================================
  // forecastHourlyFactory Tests
  // ============================================================================
  describe("forecastHourlyFactory", () => {
    let mockHourlyData;

    beforeEach(() => {
      mockHourlyData = {
        startTime: "2025-11-22T15:00:00-05:00",
        temperature: 65,
        icon: "https://api.weather.gov/icons/land/day/sct",
        probabilityOfPrecipitation: { value: 30 },
        rainAccumulation: "0.1",
        snowAccumulation: null,
        windSpeed: "10",
        windDirection: "NW",
        windGust: "15"
      };
    });

    it("should create hourly forecast item", () => {
      const result = module.forecastHourlyFactory(mockHourlyData);

      expect(result.time).toBeDefined();
      expect(result.temperature).toBe("65°");
      expect(result.iconPath).toBeDefined();
      expect(result.precipitation).toBeDefined();
      expect(result.wind).toBeDefined();
    });

    it("should format time correctly", () => {
      module.config.label_timeFormat = "h a";
      const result = module.forecastHourlyFactory(mockHourlyData);

      expect(result.time).toBe("3 pm");
    });

    it("should round temperature", () => {
      mockHourlyData.temperature = 64.7;
      const result = module.forecastHourlyFactory(mockHourlyData);

      expect(result.temperature).toBe("65°");
    });
  });

  // ============================================================================
  // forecastDailyFactory Tests
  // ============================================================================
  describe("forecastDailyFactory", () => {
    let mockDailyData;

    beforeEach(() => {
      mockDailyData = {
        startTime: "2025-11-22T06:00:00-05:00",
        maxTemperature: 75,
        minTemperature: 55,
        icon: "https://api.weather.gov/icons/land/day/sct",
        probabilityOfPrecipitation: { value: 20 },
        rainAccumulation: null,
        snowAccumulation: null,
        windSpeed: "8",
        windDirection: "N",
        windGust: "12"
      };
    });

    it("should create daily forecast item", () => {
      const result = module.forecastDailyFactory(mockDailyData);

      expect(result.day).toBeDefined();
      expect(result.tempRange).toBeDefined();
      expect(result.tempRange.high).toBe("75°");
      expect(result.tempRange.low).toBe("55°");
      expect(result.iconPath).toBeDefined();
      expect(result.precipitation).toBeDefined();
      expect(result.wind).toBeDefined();
    });

    it("should format day name correctly", () => {
      module.config.label_days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
      ];
      // Nov 22, 2025 is a Saturday (day 6)
      const result = module.forecastDailyFactory(mockDailyData);

      expect(result.day).toBe("Sat");
    });

    it("should handle missing min temperature", () => {
      mockDailyData.minTemperature = undefined;
      const result = module.forecastDailyFactory(mockDailyData);

      expect(result.tempRange.low).toBe("--°");
    });
  });

  // ============================================================================
  // getGridValueMatchingDay Tests
  // ============================================================================
  describe("getGridValueMatchingDay", () => {
    beforeEach(() => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
              { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };
    });

    it("should get value for matching day", () => {
      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBe(45);
    });

    it("should return undefined when no match", () => {
      const result = module.getGridValueMatchingDay(
        "2025-11-24T06:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });

    it("should convert units if needed", () => {
      module.config.units = "metric";
      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBe("7.2"); // 45F = 7.2C
    });

    it("should return undefined when grid key doesn't exist", () => {
      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "nonexistent"
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when weatherData is null", () => {
      module.weatherData = null;
      const result = module.getGridValueMatchingDay(
        "2025-11-22T06:00:00-05:00",
        "minTemperature"
      );

      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // getGridValueWithinDuration Tests
  // ============================================================================
  describe("getGridValueWithinDuration", () => {
    beforeEach(() => {
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          temperature: {
            values: [
              { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 },
              { validTime: "2025-11-22T09:00:00-05:00/PT3H", value: 70 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };
    });

    it("should get value when timestamp is within duration", () => {
      const result = module.getGridValueWithinDuration(
        "2025-11-22T07:00:00-05:00",
        "temperature"
      );

      expect(result).toBe(65);
    });

    it("should return undefined when timestamp is outside all durations", () => {
      const result = module.getGridValueWithinDuration(
        "2025-11-22T13:00:00-05:00",
        "temperature"
      );

      expect(result).toBeUndefined();
    });

    it("should convert units if needed", () => {
      module.config.units = "metric";
      const result = module.getGridValueWithinDuration(
        "2025-11-22T07:00:00-05:00",
        "temperature"
      );

      expect(result).toBe("18.3"); // 65F ≈ 18.3C
    });
  });

  // ============================================================================
  // accumulateGridValue Tests
  // ============================================================================
  describe("accumulateGridValue", () => {
    beforeEach(() => {
      module.config.units = "metric"; // Set to metric to avoid unit conversion
      module.weatherData = {
        daily: [],
        hourly: [],
        grid: {
          quantitativePrecipitation: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0.1 },
              { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: 0.2 },
              { validTime: "2025-11-22T12:00:00-05:00/PT1H", value: 0.15 }
            ],
            uom: "wmoUnit:mm"
          }
        }
      };
    });

    it("should accumulate values for matching day", () => {
      const result = module.accumulateGridValue(
        "2025-11-22T08:00:00-05:00",
        "quantitativePrecipitation"
      );

      expect(result).toBeCloseTo(0.45, 10);
    });

    it("should convert units if needed", () => {
      module.config.units = "imperial";
      const result = module.accumulateGridValue(
        "2025-11-22T08:00:00-05:00",
        "quantitativePrecipitation"
      );

      // 0.45mm ≈ 0.02 inches
      expect(parseFloat(result)).toBeCloseTo(0.02, 2);
    });

    it("should return undefined when no matching entries", () => {
      const result = module.accumulateGridValue(
        "2025-11-23T08:00:00-05:00",
        "quantitativePrecipitation"
      );

      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================
  describe("Edge Cases", () => {
    it("formatHiLowTemperature should handle both values missing", () => {
      const result = module.formatHiLowTemperature(undefined, undefined);

      expect(result.high).toBe("--°");
      expect(result.low).toBe("--°");
    });

    it("formatHiLowTemperature should handle high present, low missing", () => {
      const result = module.formatHiLowTemperature(75, undefined);

      expect(result.high).toBe("75°");
      expect(result.low).toBe("--°");
    });

    it("formatPrecipitation should handle all null values", () => {
      const result = module.formatPrecipitation(null, null, null);

      expect(result.pop).toBe("null%");
      expect(result.accumulation).toBeNull();
      expect(result.accumulationType).toBeNull();
    });

    it("formatWind should handle null gust", () => {
      const result = module.formatWind("10", "NW", null);

      expect(result.windGust).toBeNull();
    });

    it("convertTemperature should handle string numbers", () => {
      module.config.units = "metric";
      const result = module.convertTemperature("32", true);

      expect(result).toBe("0");
    });

    it("convertDistance should handle string numbers", () => {
      const result = module.convertDistance("25.4", true);

      expect(result).toBe("1");
    });

    it("convertSpeed should handle string numbers", () => {
      const result = module.convertSpeed("100", true);

      expect(result).toBe("62");
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================
  describe("Integration Tests", () => {
    it("should process complete weather data pipeline", () => {
      module.weatherData = {
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            maxTemperature: 75,
            minTemperature: 55,
            icon: "https://api.weather.gov/icons/land/day/sct",
            probabilityOfPrecipitation: { value: 20 },
            rainAccumulation: null,
            snowAccumulation: null,
            windSpeed: "8",
            windDirection: "N",
            windGust: "12"
          }
        ],
        hourly: [],
        grid: {
          minTemperature: {
            values: [
              { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 55 }
            ],
            uom: "wmoUnit:degF"
          }
        }
      };

      const daily = module.forecastDailyFactory(module.weatherData.daily[0]);

      expect(daily.day).toBeDefined();
      expect(daily.tempRange.high).toBe("75°");
      expect(daily.tempRange.low).toBe("55°");
      expect(daily.precipitation.pop).toBe("20%");
      expect(daily.wind.windSpeed).toBeDefined();
    });

    it("should handle metric units throughout pipeline", () => {
      module.config.units = "metric";
      module.weatherData = {
        daily: [
          {
            startTime: "2025-11-22T06:00:00-05:00",
            maxTemperature: 24,
            minTemperature: 13,
            icon: "https://api.weather.gov/icons/land/day/sct",
            probabilityOfPrecipitation: { value: 20 },
            rainAccumulation: "5",
            snowAccumulation: null,
            windSpeed: "13",
            windDirection: "N",
            windGust: "19"
          }
        ],
        hourly: [],
        grid: {}
      };

      const daily = module.forecastDailyFactory(module.weatherData.daily[0]);

      expect(daily.tempRange.high).toBe("24°");
      expect(daily.tempRange.low).toBe("13°");
      expect(daily.precipitation.accumulation).toBe("5 mm");
    });
  });
});
