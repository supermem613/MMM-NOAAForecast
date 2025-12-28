/**
 * Unit tests for configuration sanitization and validation
 * Tests the sanitizeNumbers function and config handling
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

describe("Configuration Sanitization Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults
    };
    module.identifier = "test_module_config";
  });

  // ============================================================================
  // sanitizeNumbers Tests
  // ============================================================================
  describe("sanitizeNumbers", () => {
    it("should convert string numbers to integers", () => {
      module.config.updateInterval = "15";
      module.config.maxHourliesToShow = "5";

      module.sanitizeNumbers(["updateInterval", "maxHourliesToShow"]);

      expect(module.config.updateInterval).toBe(15);
      expect(module.config.maxHourliesToShow).toBe(5);
    });

    it("should keep valid integers unchanged", () => {
      module.config.updateInterval = 10;
      module.config.maxDailiesToShow = 3;

      module.sanitizeNumbers(["updateInterval", "maxDailiesToShow"]);

      expect(module.config.updateInterval).toBe(10);
      expect(module.config.maxDailiesToShow).toBe(3);
    });

    it("should use defaults for non-numeric strings", () => {
      module.config.updateInterval = "invalid";
      const defaultValue = module.defaults.updateInterval;

      module.sanitizeNumbers(["updateInterval"]);

      expect(module.config.updateInterval).toBe(defaultValue);
    });

    it("should handle empty strings by using defaults", () => {
      module.config.updateInterval = "";
      const defaultValue = module.defaults.updateInterval;

      module.sanitizeNumbers(["updateInterval"]);

      expect(module.config.updateInterval).toBe(defaultValue);
    });

    it("should handle null values by using defaults", () => {
      module.config.maxHourliesToShow = null;
      const defaultValue = module.defaults.maxHourliesToShow;

      module.sanitizeNumbers(["maxHourliesToShow"]);

      expect(module.config.maxHourliesToShow).toBe(defaultValue);
    });

    it("should handle undefined values by using defaults", () => {
      module.config.requestDelay = undefined;
      const defaultValue = module.defaults.requestDelay;

      module.sanitizeNumbers(["requestDelay"]);

      expect(module.config.requestDelay).toBe(defaultValue);
    });

    it("should truncate decimal numbers to integers", () => {
      module.config.updateInterval = 10.7;

      module.sanitizeNumbers(["updateInterval"]);

      expect(module.config.updateInterval).toBe(10);
    });

    it("should truncate string decimal numbers to integers", () => {
      module.config.updateInterval = "15.9";

      module.sanitizeNumbers(["updateInterval"]);

      expect(module.config.updateInterval).toBe(15);
    });

    it("should handle negative numbers", () => {
      module.config.updateInterval = -5;

      module.sanitizeNumbers(["updateInterval"]);

      expect(module.config.updateInterval).toBe(-5);
    });

    it("should handle zero", () => {
      module.config.requestDelay = 0;

      module.sanitizeNumbers(["requestDelay"]);

      expect(module.config.requestDelay).toBe(0);
    });

    it("should handle string zero", () => {
      module.config.requestDelay = "0";

      module.sanitizeNumbers(["requestDelay"]);

      expect(module.config.requestDelay).toBe(0);
    });

    it("should handle multiple keys", () => {
      module.config.updateInterval = "20";
      module.config.maxHourliesToShow = "6";
      module.config.maxDailiesToShow = "invalid";
      module.config.requestDelay = 100;

      module.sanitizeNumbers([
        "updateInterval",
        "maxHourliesToShow",
        "maxDailiesToShow",
        "requestDelay"
      ]);

      expect(module.config.updateInterval).toBe(20);
      expect(module.config.maxHourliesToShow).toBe(6);
      expect(module.config.maxDailiesToShow).toBe(
        module.defaults.maxDailiesToShow
      );
      expect(module.config.requestDelay).toBe(100);
    });

    it("should handle an empty keys array", () => {
      const originalConfig = { ...module.config };

      module.sanitizeNumbers([]);

      expect(module.config).toEqual(originalConfig);
    });
  });

  // ============================================================================
  // Default Values Tests
  // ============================================================================
  describe("Default Values", () => {
    it("should have sensible default for updateInterval", () => {
      expect(module.defaults.updateInterval).toBeGreaterThan(0);
    });

    it("should have sensible default for maxHourliesToShow", () => {
      expect(module.defaults.maxHourliesToShow).toBeGreaterThan(0);
    });

    it("should have sensible default for maxDailiesToShow", () => {
      expect(module.defaults.maxDailiesToShow).toBeGreaterThan(0);
    });

    it("should have default hourlyForecastInterval greater than 0", () => {
      expect(module.defaults.hourlyForecastInterval).toBeGreaterThan(0);
    });

    it("should have valid default iconset", () => {
      expect(module.iconsets[module.defaults.iconset]).toBeDefined();
    });

    it("should have valid default mainIconset", () => {
      expect(module.iconsets[module.defaults.mainIconset]).toBeDefined();
    });

    it("should have all 7 days in label_days", () => {
      expect(module.defaults.label_days).toHaveLength(7);
    });

    it("should have 16 ordinals for compass directions", () => {
      expect(module.defaults.label_ordinals).toHaveLength(16);
    });
  });

  // ============================================================================
  // validLayouts Tests
  // ============================================================================
  describe("validLayouts", () => {
    it("should include 'tiled' layout", () => {
      expect(module.validLayouts).toContain("tiled");
    });

    it("should include 'table' layout", () => {
      expect(module.validLayouts).toContain("table");
    });

    it("should have exactly 2 valid layouts", () => {
      expect(module.validLayouts).toHaveLength(2);
    });
  });

  // ============================================================================
  // iconsets Tests
  // ============================================================================
  describe("iconsets", () => {
    it("should have all expected iconsets defined", () => {
      const expectedIconsets = [
        "1m",
        "1c",
        "2m",
        "2c",
        "3m",
        "3c",
        "4m",
        "4c",
        "5m",
        "5c",
        "6fa",
        "6oa"
      ];

      expectedIconsets.forEach((iconset) => {
        expect(module.iconsets[iconset]).toBeDefined();
        expect(module.iconsets[iconset].path).toBeDefined();
        expect(module.iconsets[iconset].format).toBeDefined();
      });
    });

    it("should have svg format for all iconsets", () => {
      Object.values(module.iconsets).forEach((iconset) => {
        expect(iconset.format).toBe("svg");
      });
    });

    it("should have path matching iconset name", () => {
      Object.entries(module.iconsets).forEach(([name, iconset]) => {
        expect(iconset.path).toBe(name);
      });
    });
  });

  // ============================================================================
  // units configuration Tests
  // ============================================================================
  describe("units configuration", () => {
    it("should have rain accumulation units for imperial", () => {
      expect(module.units.accumulationRain.imperial).toBe("in");
    });

    it("should have rain accumulation units for metric", () => {
      expect(module.units.accumulationRain.metric).toBe("mm");
    });

    it("should have snow accumulation units for imperial", () => {
      expect(module.units.accumulationSnow.imperial).toBe("in");
    });

    it("should have snow accumulation units for metric", () => {
      expect(module.units.accumulationSnow.metric).toBe("mm");
    });

    it("should have wind speed units for imperial", () => {
      expect(module.units.windSpeed.imperial).toBe("mph");
    });

    it("should have wind speed units for metric", () => {
      expect(module.units.windSpeed.metric).toBe("m/s");
    });
  });
});
