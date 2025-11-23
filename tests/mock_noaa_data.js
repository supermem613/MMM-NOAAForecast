/**
 * Mock NOAA API responses for testing
 * These represent realistic scenarios where minTemperature grid data is sparse
 */

const moment = require("moment");

/**
 * Scenario 1: Complete grid data for all days (ideal case)
 */
const completeGridData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          endTime: "2025-11-22T18:00:00-05:00",
          isDaytime: true,
          temperature: 65,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 65.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        },
        {
          number: 2,
          name: "Saturday",
          startTime: "2025-11-23T06:00:00-05:00",
          endTime: "2025-11-23T18:00:00-05:00",
          isDaytime: true,
          temperature: 68,
          temperatureUnit: "F",
          windSpeed: "8 mph",
          windDirection: "N",
          icon: "https://api.weather.gov/icons/land/day/skc?size=medium",
          shortForecast: "Sunny",
          detailedForecast: "Sunny, with a high near 68.",
          probabilityOfPrecipitation: { value: 0, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      minTemperature: {
        uom: "wmoUnit:degF",
        values: [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
          { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
        ]
      },
      maxTemperature: {
        uom: "wmoUnit:degF",
        values: [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 },
          { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 78 }
        ]
      },
      quantitativePrecipitation: {
        uom: "wmoUnit:mm",
        values: []
      },
      iceAccumulation: {
        uom: "wmoUnit:mm",
        values: []
      }
    }
  }
};

/**
 * Scenario 2: Sparse grid data - minTemperature only for 2 days (common case)
 */
const sparseGridData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          temperature: 65,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 65.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        },
        {
          number: 2,
          name: "Saturday",
          startTime: "2025-11-23T06:00:00-05:00",
          temperature: 68,
          temperatureUnit: "F",
          windSpeed: "8 mph",
          windDirection: "N",
          icon: "https://api.weather.gov/icons/land/day/skc?size=medium",
          shortForecast: "Sunny",
          detailedForecast: "Sunny, with a high near 68.",
          probabilityOfPrecipitation: { value: 0, unitCode: "wmoUnit:percent" }
        },
        {
          number: 3,
          name: "Sunday",
          startTime: "2025-11-24T06:00:00-05:00",
          temperature: 70,
          temperatureUnit: "F",
          windSpeed: "5 mph",
          windDirection: "NE",
          icon: "https://api.weather.gov/icons/land/day/skc?size=medium",
          shortForecast: "Sunny",
          detailedForecast: "Sunny, with a high near 70.",
          probabilityOfPrecipitation: { value: 0, unitCode: "wmoUnit:percent" }
        },
        {
          number: 4,
          name: "Monday",
          startTime: "2025-11-25T06:00:00-05:00",
          temperature: 72,
          temperatureUnit: "F",
          windSpeed: "7 mph",
          windDirection: "E",
          icon: "https://api.weather.gov/icons/land/day/few?size=medium",
          shortForecast: "Mostly Sunny",
          detailedForecast: "Mostly sunny, with a high near 72.",
          probabilityOfPrecipitation: { value: 5, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      minTemperature: {
        uom: "wmoUnit:degF",
        values: [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
          { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 }
          // Days 3 and 4 have no minTemperature - this is realistic!
        ]
      },
      maxTemperature: {
        uom: "wmoUnit:degF",
        values: [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 },
          { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 78 },
          { validTime: "2025-11-24T00:00:00-05:00/PT24H", value: 80 },
          { validTime: "2025-11-25T00:00:00-05:00/PT24H", value: 82 }
        ]
      },
      quantitativePrecipitation: {
        uom: "wmoUnit:mm",
        values: []
      },
      iceAccumulation: {
        uom: "wmoUnit:mm",
        values: []
      }
    }
  }
};

/**
 * Scenario 3: Missing minTemperature field entirely (worst case)
 */
const missingMinTempData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          temperature: 65,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 65.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      // minTemperature field is completely missing
      maxTemperature: {
        uom: "wmoUnit:degF",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }]
      },
      quantitativePrecipitation: {
        uom: "wmoUnit:mm",
        values: []
      },
      iceAccumulation: {
        uom: "wmoUnit:mm",
        values: []
      }
    }
  }
};

/**
 * Scenario 4: Null values in grid data
 */
const nullValuesData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          temperature: 65,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 65.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      minTemperature: {
        uom: "wmoUnit:degF",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: null }]
      },
      maxTemperature: {
        uom: "wmoUnit:degF",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }]
      }
    }
  }
};

/**
 * Scenario 5: Timestamp mismatch (grid data for different days than forecast)
 */
const timestampMismatchData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          temperature: 65,
          temperatureUnit: "F",
          windSpeed: "10 mph",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 65.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      minTemperature: {
        uom: "wmoUnit:degF",
        values: [
          // Grid data is for Nov 24-25, but forecast is for Nov 22
          { validTime: "2025-11-24T00:00:00-05:00/PT24H", value: 50 },
          { validTime: "2025-11-25T00:00:00-05:00/PT24H", value: 52 }
        ]
      },
      maxTemperature: {
        uom: "wmoUnit:degF",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 75 }]
      }
    }
  }
};

/**
 * Scenario 6: Metric units (Celsius)
 */
const metricUnitsData = {
  forecast: {
    properties: {
      periods: [
        {
          number: 1,
          name: "Today",
          startTime: "2025-11-22T06:00:00-05:00",
          temperature: 18,
          temperatureUnit: "C",
          windSpeed: "16 km/h",
          windDirection: "NW",
          icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
          shortForecast: "Partly Cloudy",
          detailedForecast: "Partly cloudy, with a high near 18.",
          probabilityOfPrecipitation: { value: 10, unitCode: "wmoUnit:percent" }
        }
      ]
    }
  },
  forecastGridData: {
    properties: {
      minTemperature: {
        uom: "wmoUnit:degC",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 7 }]
      },
      maxTemperature: {
        uom: "wmoUnit:degC",
        values: [{ validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 24 }]
      }
    }
  }
};

module.exports = {
  completeGridData,
  sparseGridData,
  missingMinTempData,
  nullValuesData,
  timestampMismatchData,
  metricUnitsData
};
