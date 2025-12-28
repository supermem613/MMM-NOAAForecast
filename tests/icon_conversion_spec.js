/**
 * Unit tests for NOAA icon conversion and icon path generation
 * Tests the convertNOAAtoIcon and generateIconSrc functions
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

describe("Icon Conversion and Generation Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      iconset: "1c",
      mainIconset: "1c"
    };
    module.identifier = "test_module_icons";
    module.file = jest.fn((path) => `/modules/MMM-NOAAForecast/${path}`);
  });

  // ============================================================================
  // convertNOAAtoIcon Tests
  // ============================================================================
  describe("convertNOAAtoIcon", () => {
    describe("Clear sky conditions", () => {
      it("should convert skc (sky clear) day to clear-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/skc"
        );
        expect(result).toBe("clear-day");
      });

      it("should convert skc night to clear-night", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/night/skc"
        );
        expect(result).toBe("clear-night");
      });

      it("should handle hot condition as clear-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/hot"
        );
        expect(result).toBe("clear-day");
      });

      it("should handle cold condition as clear-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/cold"
        );
        expect(result).toBe("clear-day");
      });
    });

    describe("Partly cloudy conditions", () => {
      it("should convert few clouds day to partly-cloudy-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/few"
        );
        expect(result).toBe("partly-cloudy-day");
      });

      it("should convert sct (scattered) day to partly-cloudy-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/sct"
        );
        expect(result).toBe("partly-cloudy-day");
      });

      it("should convert few clouds night to partly-cloudy-night", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/night/few"
        );
        expect(result).toBe("partly-cloudy-night");
      });

      it("should convert sct night to partly-cloudy-night", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/night/sct"
        );
        expect(result).toBe("partly-cloudy-night");
      });
    });

    describe("Cloudy conditions", () => {
      it("should convert bkn (broken clouds) to cloudy", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/bkn"
        );
        expect(result).toBe("cloudy");
      });

      it("should convert ovc (overcast) to cloudy", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/ovc"
        );
        expect(result).toBe("cloudy");
      });
    });

    describe("Rain conditions", () => {
      it("should convert rain to rain", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain"
        );
        expect(result).toBe("rain");
      });

      it("should convert rain_showers to rain", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain_showers"
        );
        expect(result).toBe("rain");
      });

      it("should convert rain_showers_hi to rain", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain_showers_hi"
        );
        expect(result).toBe("rain");
      });
    });

    describe("Snow conditions", () => {
      it("should convert snow to snow", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/snow"
        );
        expect(result).toBe("snow");
      });

      it("should convert rain_snow to snow", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain_snow"
        );
        expect(result).toBe("snow");
      });

      it("should convert blizzard to snow", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/blizzard"
        );
        expect(result).toBe("snow");
      });

      it("should convert snow_sleet to snow", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/snow_sleet"
        );
        expect(result).toBe("snow");
      });

      it("should convert snow_fzra to snow", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/snow_fzra"
        );
        expect(result).toBe("snow");
      });
    });

    describe("Sleet/freezing conditions", () => {
      it("should convert sleet to sleet", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/sleet"
        );
        expect(result).toBe("sleet");
      });

      it("should convert fzra (freezing rain) to sleet", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/fzra"
        );
        expect(result).toBe("sleet");
      });

      it("should convert rain_sleet to sleet", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain_sleet"
        );
        expect(result).toBe("sleet");
      });
    });

    describe("Thunderstorm conditions", () => {
      it("should convert tsra (thunderstorm) to thunderstorm", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tsra"
        );
        expect(result).toBe("thunderstorm");
      });

      it("should convert tsra_sct to thunderstorm", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tsra_sct"
        );
        expect(result).toBe("thunderstorm");
      });

      it("should convert tsra_hi to thunderstorm", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tsra_hi"
        );
        expect(result).toBe("thunderstorm");
      });

      it("should convert tropical_storm to thunderstorm", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tropical_storm"
        );
        expect(result).toBe("thunderstorm");
      });
    });

    describe("Fog and visibility conditions", () => {
      it("should convert fog to fog", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/fog"
        );
        expect(result).toBe("fog");
      });

      it("should convert haze to fog", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/haze"
        );
        expect(result).toBe("fog");
      });

      it("should convert smoke to fog", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/smoke"
        );
        expect(result).toBe("fog");
      });

      it("should convert dust to fog", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/dust"
        );
        expect(result).toBe("fog");
      });
    });

    describe("Severe weather conditions", () => {
      it("should convert tornado to tornado", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tornado"
        );
        expect(result).toBe("tornado");
      });

      it("should convert hurricane to tornado", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/hurricane"
        );
        expect(result).toBe("tornado");
      });
    });

    describe("Wind conditions with sky cover", () => {
      it("should convert wind_skc day to clear-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/wind_skc"
        );
        expect(result).toBe("clear-day");
      });

      it("should convert wind_skc night to clear-night", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/night/wind_skc"
        );
        expect(result).toBe("clear-night");
      });

      it("should convert wind_few day to partly-cloudy-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/wind_few"
        );
        expect(result).toBe("partly-cloudy-day");
      });

      it("should convert wind_sct day to partly-cloudy-day", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/wind_sct"
        );
        expect(result).toBe("partly-cloudy-day");
      });

      it("should convert wind_bkn to cloudy", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/wind_bkn"
        );
        expect(result).toBe("cloudy");
      });

      it("should convert wind_ovc to cloudy", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/wind_ovc"
        );
        expect(result).toBe("cloudy");
      });
    });

    describe("Edge cases", () => {
      it("should handle undefined input", () => {
        const result = module.convertNOAAtoIcon(undefined);
        expect(result).toBeUndefined();
      });

      it("should handle null input", () => {
        const result = module.convertNOAAtoIcon(null);
        expect(result).toBeUndefined();
      });

      it("should handle empty string", () => {
        const result = module.convertNOAAtoIcon("");
        expect(result).toBeUndefined();
      });

      it("should handle icon URL with size parameter", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain?size=medium"
        );
        expect(result).toBe("rain");
      });

      it("should handle icon URL with probability", () => {
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/rain,40"
        );
        expect(result).toBe("rain");
      });

      it("should handle compound icon URLs (first match wins)", () => {
        // Compound URLs like "tsra,30/rain,20" are parsed and first matching
        // code in the description mapping wins
        const result = module.convertNOAAtoIcon(
          "https://api.weather.gov/icons/land/day/tsra,30/rain,20"
        );
        // "rain" appears earlier in the noaaDescriptions object iteration order
        // so it matches first
        expect(result).toBe("rain");
      });
    });
  });

  // ============================================================================
  // generateIconSrc Tests
  // ============================================================================
  describe("generateIconSrc", () => {
    it("should generate correct path for main icon", () => {
      const result = module.generateIconSrc("rain", true);
      expect(result).toBe("/modules/MMM-NOAAForecast/icons/1c/rain.svg");
    });

    it("should generate correct path for forecast icon", () => {
      const result = module.generateIconSrc("snow", false);
      expect(result).toBe("/modules/MMM-NOAAForecast/icons/1c/snow.svg");
    });

    it("should use mainIconset for main icons", () => {
      module.config.mainIconset = "2c";
      module.config.iconset = "1c";
      const result = module.generateIconSrc("clear-day", true);
      expect(result).toBe("/modules/MMM-NOAAForecast/icons/2c/clear-day.svg");
    });

    it("should use iconset for forecast icons", () => {
      module.config.mainIconset = "2c";
      module.config.iconset = "3m";
      const result = module.generateIconSrc("cloudy", false);
      expect(result).toBe("/modules/MMM-NOAAForecast/icons/3m/cloudy.svg");
    });

    it("should generate path for inline icons", () => {
      const result = module.generateIconSrc("i-rain", false);
      expect(result).toBe("/modules/MMM-NOAAForecast/icons/1c/i-rain.svg");
    });

    it("should handle all available iconsets", () => {
      const iconsets = [
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
      iconsets.forEach((iconset) => {
        module.config.iconset = iconset;
        const result = module.generateIconSrc("rain", false);
        expect(result).toContain(`/icons/${iconset}/rain.svg`);
      });
    });
  });

  // ============================================================================
  // getAnimatedIconId Tests
  // ============================================================================
  describe("getAnimatedIconId", () => {
    beforeEach(() => {
      module.iconIdCounter = 0;
    });

    it("should generate unique ids", () => {
      const id1 = module.getAnimatedIconId();
      const id2 = module.getAnimatedIconId();
      const id3 = module.getAnimatedIconId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should include identifier in id", () => {
      const id = module.getAnimatedIconId();
      expect(id).toContain(module.identifier);
    });

    it("should increment counter", () => {
      expect(module.iconIdCounter).toBe(0);
      module.getAnimatedIconId();
      expect(module.iconIdCounter).toBe(1);
      module.getAnimatedIconId();
      expect(module.iconIdCounter).toBe(2);
    });

    it("should follow expected format", () => {
      const id = module.getAnimatedIconId();
      expect(id).toMatch(/^skycon_.*_\d+$/);
    });
  });
});
