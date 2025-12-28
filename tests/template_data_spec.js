/**
 * Unit tests for getTemplateData function
 * Tests the data structure provided to the Nunjucks template
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

describe("getTemplateData Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      forecastLayout: "tiled",
      mainIconSize: 100,
      forecastTiledIconSize: 70,
      forecastTableIconSize: 30,
      iconset: "1c",
      mainIconset: "1c",
      moduleTimestampIdPrefix: "NOAA_CALL_TIMESTAMP_"
    };
    module.identifier = "test_module_template";
    module.formattedWeatherData = null;
    module.dataRefreshTimeStamp = null;
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
    module.translate = jest.fn((key) =>
      key === "LOADING" ? "Loading..." : key
    );
  });

  // ============================================================================
  // Basic Structure Tests
  // ============================================================================
  describe("Basic structure", () => {
    it("should return object with all required properties", () => {
      const result = module.getTemplateData();

      expect(result).toHaveProperty("phrases");
      expect(result).toHaveProperty("loading");
      expect(result).toHaveProperty("config");
      expect(result).toHaveProperty("forecast");
      expect(result).toHaveProperty("inlineIcons");
      expect(result).toHaveProperty("animatedIconSizes");
      expect(result).toHaveProperty("moduleTimestampIdPrefix");
      expect(result).toHaveProperty("identifier");
      expect(result).toHaveProperty("timeStamp");
    });

    it("should include phrases with loading text", () => {
      const result = module.getTemplateData();

      expect(result.phrases.loading).toBeDefined();
    });
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe("Loading state", () => {
    it("should set loading to true when formattedWeatherData is null", () => {
      module.formattedWeatherData = null;

      const result = module.getTemplateData();

      expect(result.loading).toBe(true);
    });

    it("should set loading to false when formattedWeatherData is present", () => {
      module.formattedWeatherData = {
        currently: {},
        summary: "Sunny",
        hourly: [],
        daily: []
      };

      const result = module.getTemplateData();

      expect(result.loading).toBe(false);
    });
  });

  // ============================================================================
  // Config Pass-through Tests
  // ============================================================================
  describe("Config pass-through", () => {
    it("should include full config object", () => {
      const result = module.getTemplateData();

      expect(result.config).toBe(module.config);
    });

    it("should reflect config changes", () => {
      module.config.showCurrentConditions = false;
      module.config.colored = true;

      const result = module.getTemplateData();

      expect(result.config.showCurrentConditions).toBe(false);
      expect(result.config.colored).toBe(true);
    });
  });

  // ============================================================================
  // Inline Icons Tests
  // ============================================================================
  describe("Inline icons", () => {
    it("should include rain inline icon path", () => {
      const result = module.getTemplateData();

      expect(result.inlineIcons.rain).toBeDefined();
      expect(result.inlineIcons.rain).toContain("i-rain");
    });

    it("should include snow inline icon path", () => {
      const result = module.getTemplateData();

      expect(result.inlineIcons.snow).toBeDefined();
      expect(result.inlineIcons.snow).toContain("i-snow");
    });

    it("should include wind inline icon path", () => {
      const result = module.getTemplateData();

      expect(result.inlineIcons.wind).toBeDefined();
      expect(result.inlineIcons.wind).toContain("i-wind");
    });

    it("should use configured iconset for inline icons", () => {
      module.config.iconset = "2m";

      const result = module.getTemplateData();

      expect(result.inlineIcons.rain).toContain("2m");
    });
  });

  // ============================================================================
  // Animated Icon Sizes Tests
  // ============================================================================
  describe("Animated icon sizes", () => {
    it("should include main icon size from config", () => {
      module.config.mainIconSize = 120;

      const result = module.getTemplateData();

      expect(result.animatedIconSizes.main).toBe(120);
    });

    it("should use tiled icon size when layout is tiled", () => {
      module.config.forecastLayout = "tiled";
      module.config.forecastTiledIconSize = 80;
      module.config.forecastTableIconSize = 40;

      const result = module.getTemplateData();

      expect(result.animatedIconSizes.forecast).toBe(80);
    });

    it("should use table icon size when layout is table", () => {
      module.config.forecastLayout = "table";
      module.config.forecastTiledIconSize = 80;
      module.config.forecastTableIconSize = 40;

      const result = module.getTemplateData();

      expect(result.animatedIconSizes.forecast).toBe(40);
    });
  });

  // ============================================================================
  // Identifier and Timestamp Tests
  // ============================================================================
  describe("Identifier and timestamp", () => {
    it("should include module identifier", () => {
      module.identifier = "unique_module_id_123";

      const result = module.getTemplateData();

      expect(result.identifier).toBe("unique_module_id_123");
    });

    it("should include moduleTimestampIdPrefix from config", () => {
      module.config.moduleTimestampIdPrefix = "CUSTOM_PREFIX_";

      const result = module.getTemplateData();

      expect(result.moduleTimestampIdPrefix).toBe("CUSTOM_PREFIX_");
    });

    it("should include dataRefreshTimeStamp", () => {
      module.dataRefreshTimeStamp = "1735380000000";

      const result = module.getTemplateData();

      expect(result.timeStamp).toBe("1735380000000");
    });

    it("should handle null timestamp", () => {
      module.dataRefreshTimeStamp = null;

      const result = module.getTemplateData();

      expect(result.timeStamp).toBeNull();
    });
  });

  // ============================================================================
  // Forecast Data Tests
  // ============================================================================
  describe("Forecast data", () => {
    it("should include formattedWeatherData as forecast", () => {
      const weatherData = {
        currently: { temperature: "72°" },
        summary: "Partly Cloudy",
        hourly: [{ time: "3 pm", temperature: "75°" }],
        daily: [{ day: "Mon", tempRange: { high: "80°", low: "60°" } }]
      };
      module.formattedWeatherData = weatherData;

      const result = module.getTemplateData();

      expect(result.forecast).toBe(weatherData);
    });

    it("should be null when no data loaded", () => {
      module.formattedWeatherData = null;

      const result = module.getTemplateData();

      expect(result.forecast).toBeNull();
    });
  });
});

// ============================================================================
// getScripts and getStyles Tests
// ============================================================================
describe("Module Resource Methods", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
  });

  describe("getScripts", () => {
    it("should return array of required scripts", () => {
      const scripts = module.getScripts();

      expect(Array.isArray(scripts)).toBe(true);
    });

    it("should include moment.js", () => {
      const scripts = module.getScripts();

      expect(scripts).toContain("moment.js");
    });

    it("should include skycons.js", () => {
      const scripts = module.getScripts();

      expect(scripts.some((s) => s.includes("skycons.js"))).toBe(true);
    });
  });

  describe("getStyles", () => {
    it("should return array of required styles", () => {
      const styles = module.getStyles();

      expect(Array.isArray(styles)).toBe(true);
    });

    it("should include module CSS file", () => {
      const styles = module.getStyles();

      expect(styles).toContain("MMM-NOAAForecast.css");
    });
  });

  describe("getTemplate", () => {
    it("should return template filename", () => {
      const template = module.getTemplate();

      expect(template).toBe("MMM-NOAAForecast.njk");
    });
  });
});
