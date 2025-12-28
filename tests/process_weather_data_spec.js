/**
 * Unit tests for the processWeatherData pipeline
 * Tests the data transformation and output structure
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

describe("Process Weather Data Pipeline Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      units: "imperial",
      concise: true,
      showCurrentConditions: true,
      showSummary: true,
      showHourlyForecast: true,
      showDailyForecast: true,
      maxHourliesToShow: 3,
      maxDailiesToShow: 3,
      hourlyForecastInterval: 1,
      includeTodayInDailyForecast: false,
      showPrecipitationStartStop: false,
      label_timeFormat: "h a",
      label_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      label_high: "H",
      label_low: "L",
      label_gust: "max",
      iconset: "1c",
      mainIconset: "1c",
      useAnimatedIcons: false
    };
    module.identifier = "test_module_process";
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
  });

  // Helper to create base weather data structure
  function createBaseWeatherData() {
    const now = moment();
    const tomorrow = moment().add(1, "day").startOf("day");

    // Create enough hourly entries for the hourly forecast processing
    const hourlyEntries = [];
    for (let i = 0; i < 24; i++) {
      hourlyEntries.push({
        startTime: now.clone().add(i, "hours").format(),
        temperature: 65 + i,
        temperatureUnit: "F",
        icon: "https://api.weather.gov/icons/land/day/sct",
        windSpeed: "10",
        windDirection: "NW",
        windGust: "15",
        relativeHumidity: { value: 50 },
        probabilityOfPrecipitation: { value: 20 },
        feelsLike: 63 + i,
        rainAccumulation: null,
        snowAccumulation: null
      });
    }

    return {
      hourly: hourlyEntries,
      daily: [
        {
          startTime: now.format(),
          temperature: 72,
          temperatureUnit: "F",
          maxTemperature: "75",
          minTemperature: "55",
          icon: "https://api.weather.gov/icons/land/day/sct",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy with a high near 72.",
          windSpeed: "10 mph",
          windDirection: "NW",
          windGust: "15",
          probabilityOfPrecipitation: { value: 20 },
          rainAccumulation: null,
          snowAccumulation: null
        },
        {
          startTime: tomorrow.format(),
          temperature: 68,
          temperatureUnit: "F",
          maxTemperature: "70",
          minTemperature: "52",
          icon: "https://api.weather.gov/icons/land/day/few",
          shortForecast: "Mostly Sunny",
          detailedForecast: "Mostly sunny with a high near 68.",
          windSpeed: "8 mph",
          windDirection: "W",
          windGust: "12",
          probabilityOfPrecipitation: { value: 10 },
          rainAccumulation: null,
          snowAccumulation: null
        },
        {
          startTime: tomorrow.clone().add(1, "day").format(),
          temperature: 65,
          temperatureUnit: "F",
          maxTemperature: "68",
          minTemperature: "50",
          icon: "https://api.weather.gov/icons/land/day/skc",
          shortForecast: "Sunny",
          detailedForecast: "Sunny with a high near 65.",
          windSpeed: "5 mph",
          windDirection: "S",
          windGust: "8",
          probabilityOfPrecipitation: { value: 5 },
          rainAccumulation: null,
          snowAccumulation: null
        }
      ],
      grid: {}
    };
  }

  // ============================================================================
  // processWeatherData Output Structure Tests
  // ============================================================================
  describe("processWeatherData output structure", () => {
    beforeEach(() => {
      module.weatherData = createBaseWeatherData();
    });

    it("should return an object with required properties", () => {
      const result = module.processWeatherData();

      expect(result).toHaveProperty("currently");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("precipitationChange");
      expect(result).toHaveProperty("hourly");
      expect(result).toHaveProperty("daily");
    });

    it("should include current conditions", () => {
      const result = module.processWeatherData();

      expect(result.currently.temperature).toBeDefined();
      expect(result.currently.feelslike).toBeDefined();
      expect(result.currently.iconPath).toBeDefined();
      expect(result.currently.tempRange).toBeDefined();
      expect(result.currently.precipitation).toBeDefined();
      expect(result.currently.wind).toBeDefined();
    });

    it("should format current temperature correctly", () => {
      const result = module.processWeatherData();

      expect(result.currently.temperature).toMatch(/^\d+°$/);
    });

    it("should format feels like temperature correctly", () => {
      const result = module.processWeatherData();

      expect(result.currently.feelslike).toMatch(/^-?\d+°$/);
    });

    it("should include summary from forecast", () => {
      const result = module.processWeatherData();

      expect(result.summary).toBe("Partly Cloudy");
    });

    it("should use detailed forecast when not concise", () => {
      module.config.concise = false;
      const result = module.processWeatherData();

      expect(result.summary).toContain("Partly cloudy with a high near 72");
    });
  });

  // ============================================================================
  // Hourly Forecast Processing Tests
  // ============================================================================
  describe("Hourly forecast processing", () => {
    beforeEach(() => {
      module.weatherData = createBaseWeatherData();
      // Default interval is 3, so we need at least 3*maxHourliesToShow + 1 entries
      module.config.hourlyForecastInterval = 3;
    });

    it("should return correct number of hourly forecasts", () => {
      module.config.maxHourliesToShow = 2;

      const result = module.processWeatherData();

      expect(result.hourly).toHaveLength(2);
    });

    it("should respect hourlyForecastInterval", () => {
      module.config.hourlyForecastInterval = 2;
      module.config.maxHourliesToShow = 3;

      const result = module.processWeatherData();

      // Should skip entries based on interval
      expect(result.hourly).toHaveLength(3);
    });

    it("should return empty array when showHourlyForecast is false", () => {
      module.config.showHourlyForecast = false;

      const result = module.processWeatherData();

      expect(result.hourly).toHaveLength(0);
    });

    it("should format hourly items correctly", () => {
      module.config.maxHourliesToShow = 1;
      module.config.hourlyForecastInterval = 1;

      const result = module.processWeatherData();

      if (result.hourly.length > 0) {
        const hourlyItem = result.hourly[0];
        expect(hourlyItem.time).toBeDefined();
        expect(hourlyItem.temperature).toMatch(/^\d+°$/);
        expect(hourlyItem.iconPath).toBeDefined();
        expect(hourlyItem.precipitation).toBeDefined();
        expect(hourlyItem.wind).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Daily Forecast Processing Tests
  // ============================================================================
  describe("Daily forecast processing", () => {
    beforeEach(() => {
      module.weatherData = createBaseWeatherData();
    });

    it("should return correct number of daily forecasts", () => {
      module.config.maxDailiesToShow = 2;

      const result = module.processWeatherData();

      expect(result.daily.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array when showDailyForecast is false", () => {
      module.config.showDailyForecast = false;

      const result = module.processWeatherData();

      expect(result.daily).toHaveLength(0);
    });

    it("should include today when includeTodayInDailyForecast is true", () => {
      module.config.includeTodayInDailyForecast = true;
      module.config.maxDailiesToShow = 5;

      const result = module.processWeatherData();

      // Should include today's forecast
      expect(result.daily.length).toBeGreaterThan(0);
    });

    it("should format daily items correctly", () => {
      module.config.maxDailiesToShow = 1;
      module.config.includeTodayInDailyForecast = true;

      const result = module.processWeatherData();

      if (result.daily.length > 0) {
        const dailyItem = result.daily[0];
        expect(dailyItem.day).toBeDefined();
        expect(dailyItem.tempRange).toBeDefined();
        expect(dailyItem.tempRange.high).toBeDefined();
        expect(dailyItem.tempRange.low).toBeDefined();
        expect(dailyItem.iconPath).toBeDefined();
        expect(dailyItem.precipitation).toBeDefined();
        expect(dailyItem.wind).toBeDefined();
      }
    });

    it("should skip consecutive duplicate days", () => {
      // Insert duplicate entries for same day right after the first entry (consecutive)
      // The module only skips consecutive duplicates (previousEntryDate check)
      const now = moment();
      const duplicateEntry = {
        startTime: now.clone().add(12, "hours").format(), // Same day as first entry
        temperature: 70,
        temperatureUnit: "F",
        maxTemperature: "72",
        minTemperature: "58",
        icon: "https://api.weather.gov/icons/land/night/sct",
        shortForecast: "Partly Cloudy",
        detailedForecast: "Partly cloudy tonight.",
        windSpeed: "5 mph",
        windDirection: "NW",
        windGust: "10",
        probabilityOfPrecipitation: { value: 15 },
        rainAccumulation: null,
        snowAccumulation: null
      };

      // Insert at position 1 (after the first entry for today)
      module.weatherData.daily.splice(1, 0, duplicateEntry);

      module.config.includeTodayInDailyForecast = true;
      module.config.maxDailiesToShow = 10;

      const result = module.processWeatherData();

      // Count unique days in result - should skip the consecutive duplicate
      const days = result.daily.map((d) => d.day);
      const uniqueDays = new Set(days);
      expect(uniqueDays.size).toBe(days.length);
    });
  });

  // ============================================================================
  // Temperature Range Tests
  // ============================================================================
  describe("Temperature range formatting", () => {
    beforeEach(() => {
      module.weatherData = createBaseWeatherData();
    });

    it("should format high temperature correctly", () => {
      const result = module.processWeatherData();

      expect(result.currently.tempRange.high).toMatch(/\d+°$/);
    });

    it("should format low temperature correctly", () => {
      const result = module.processWeatherData();

      expect(result.currently.tempRange.low).toMatch(/\d+°$/);
    });

    it("should include labels when not concise", () => {
      module.config.concise = false;

      const result = module.processWeatherData();

      expect(result.currently.tempRange.high).toContain(
        module.config.label_high
      );
      expect(result.currently.tempRange.low).toContain(module.config.label_low);
    });
  });

  // ============================================================================
  // Animated Icon Support Tests
  // ============================================================================
  describe("Animated icon support", () => {
    beforeEach(() => {
      module.weatherData = createBaseWeatherData();
      module.iconIdCounter = 0;
    });

    it("should include animatedIconId when useAnimatedIcons is true", () => {
      module.config.useAnimatedIcons = true;

      const result = module.processWeatherData();

      expect(result.currently.animatedIconId).toBeDefined();
    });

    it("should include animatedIconName when useAnimatedIcons is true", () => {
      module.config.useAnimatedIcons = true;

      const result = module.processWeatherData();

      expect(result.currently.animatedIconName).toBeDefined();
    });

    it("should not include animatedIconId when useAnimatedIcons is false", () => {
      module.config.useAnimatedIcons = false;

      const result = module.processWeatherData();

      expect(result.currently.animatedIconId).toBeNull();
    });

    it("should include animated icons in hourly when animateMainIconOnly is false", () => {
      module.config.useAnimatedIcons = true;
      module.config.animateMainIconOnly = false;
      module.config.maxHourliesToShow = 1;
      module.config.hourlyForecastInterval = 1;

      const result = module.processWeatherData();

      if (result.hourly.length > 0) {
        expect(result.hourly[0].animatedIconId).toBeDefined();
        expect(result.hourly[0].animatedIconName).toBeDefined();
      }
    });
  });
});
