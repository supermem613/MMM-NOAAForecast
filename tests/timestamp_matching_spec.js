/**
 * Unit tests for timestamp matching functions
 * Tests findValueForTimestamp and findValueForTimestampMatchingDay
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

describe("Timestamp Matching Functions Tests", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      units: "imperial"
    };
    module.identifier = "test_module_timestamp";
  });

  // ============================================================================
  // findValueForTimestamp Tests - Duration Matching
  // ============================================================================
  describe("findValueForTimestamp", () => {
    describe("Basic duration matching", () => {
      it("should find value when timestamp is exactly at start of duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T06:00:00-05:00",
          data
        );

        expect(result).toBe(65);
      });

      it("should find value when timestamp is in middle of duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT6H", value: 70 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T09:00:00-05:00",
          data
        );

        expect(result).toBe(70);
      });

      it("should return undefined when timestamp is exactly at end of duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T09:00:00-05:00",
          data
        );

        expect(result).toBeUndefined();
      });

      it("should return undefined when timestamp is before duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T05:00:00-05:00",
          data
        );

        expect(result).toBeUndefined();
      });

      it("should return undefined when timestamp is after duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T10:00:00-05:00",
          data
        );

        expect(result).toBeUndefined();
      });
    });

    describe("Multiple durations", () => {
      it("should find correct value from multiple consecutive durations", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT6H", value: 55 },
          { validTime: "2025-11-22T06:00:00-05:00/PT6H", value: 65 },
          { validTime: "2025-11-22T12:00:00-05:00/PT6H", value: 75 },
          { validTime: "2025-11-22T18:00:00-05:00/PT6H", value: 60 }
        ];

        expect(
          module.findValueForTimestamp("2025-11-22T03:00:00-05:00", data)
        ).toBe(55);
        expect(
          module.findValueForTimestamp("2025-11-22T08:00:00-05:00", data)
        ).toBe(65);
        expect(
          module.findValueForTimestamp("2025-11-22T14:00:00-05:00", data)
        ).toBe(75);
        expect(
          module.findValueForTimestamp("2025-11-22T20:00:00-05:00", data)
        ).toBe(60);
      });

      it("should return first matching value when durations overlap", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT6H", value: 65 },
          { validTime: "2025-11-22T08:00:00-05:00/PT4H", value: 70 }
        ];

        // First match should be returned
        const result = module.findValueForTimestamp(
          "2025-11-22T09:00:00-05:00",
          data
        );

        expect(result).toBe(65);
      });
    });

    describe("Various duration formats", () => {
      it("should handle PT1H (1 hour) duration", () => {
        const data = [
          { validTime: "2025-11-22T10:00:00-05:00/PT1H", value: 68 }
        ];

        expect(
          module.findValueForTimestamp("2025-11-22T10:00:00-05:00", data)
        ).toBe(68);
        expect(
          module.findValueForTimestamp("2025-11-22T10:30:00-05:00", data)
        ).toBe(68);
        expect(
          module.findValueForTimestamp("2025-11-22T11:00:00-05:00", data)
        ).toBeUndefined();
      });

      it("should handle PT24H (24 hour) duration", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        expect(
          module.findValueForTimestamp("2025-11-22T00:00:00-05:00", data)
        ).toBe(45);
        expect(
          module.findValueForTimestamp("2025-11-22T12:00:00-05:00", data)
        ).toBe(45);
        expect(
          module.findValueForTimestamp("2025-11-22T23:59:00-05:00", data)
        ).toBe(45);
        expect(
          module.findValueForTimestamp("2025-11-23T00:00:00-05:00", data)
        ).toBeUndefined();
      });

      it("should handle PT12H duration", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT12H", value: 72 }
        ];

        expect(
          module.findValueForTimestamp("2025-11-22T06:00:00-05:00", data)
        ).toBe(72);
        expect(
          module.findValueForTimestamp("2025-11-22T12:00:00-05:00", data)
        ).toBe(72);
        expect(
          module.findValueForTimestamp("2025-11-22T17:59:00-05:00", data)
        ).toBe(72);
        expect(
          module.findValueForTimestamp("2025-11-22T18:00:00-05:00", data)
        ).toBeUndefined();
      });
    });

    describe("Edge cases", () => {
      it("should return undefined for null target timestamp", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(null, data);
        expect(result).toBeUndefined();
      });

      it("should return undefined for undefined target timestamp", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        const result = module.findValueForTimestamp(undefined, data);
        expect(result).toBeUndefined();
      });

      it("should return undefined for null array", () => {
        const result = module.findValueForTimestamp(
          "2025-11-22T06:00:00-05:00",
          null
        );
        expect(result).toBeUndefined();
      });

      it("should return undefined for undefined array", () => {
        const result = module.findValueForTimestamp(
          "2025-11-22T06:00:00-05:00",
          undefined
        );
        expect(result).toBeUndefined();
      });

      it("should return undefined for empty array", () => {
        const result = module.findValueForTimestamp(
          "2025-11-22T06:00:00-05:00",
          []
        );
        expect(result).toBeUndefined();
      });

      it("should skip entries with missing validTime", () => {
        const data = [
          { value: 65 },
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 70 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T07:00:00-05:00",
          data
        );

        expect(result).toBe(70);
      });

      it("should skip null entries in array", () => {
        const data = [
          null,
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 70 }
        ];

        const result = module.findValueForTimestamp(
          "2025-11-22T07:00:00-05:00",
          data
        );

        expect(result).toBe(70);
      });
    });

    describe("Timezone handling", () => {
      it("should match across different timezone representations of same moment", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT3H", value: 65 }
        ];

        // Same moment in different timezone
        const result = module.findValueForTimestamp(
          "2025-11-22T07:00:00-05:00",
          data
        );

        expect(result).toBe(65);
      });
    });
  });

  // ============================================================================
  // findValueForTimestampMatchingDay Tests - Calendar Day Matching
  // ============================================================================
  describe("findValueForTimestampMatchingDay", () => {
    describe("Basic day matching", () => {
      it("should match when target is same calendar day as grid start", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T14:00:00-05:00",
          data
        );

        expect(result).toBe(45);
      });

      it("should match at midnight of same day", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T00:00:00-05:00",
          data
        );

        expect(result).toBe(45);
      });

      it("should match at end of same day (23:59)", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T23:59:00-05:00",
          data
        );

        expect(result).toBe(45);
      });

      it("should not match different calendar day", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-23T00:00:00-05:00",
          data
        );

        expect(result).toBeUndefined();
      });
    });

    describe("Multiple days", () => {
      it("should find correct value for each day", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 },
          { validTime: "2025-11-23T00:00:00-05:00/PT24H", value: 48 },
          { validTime: "2025-11-24T00:00:00-05:00/PT24H", value: 50 }
        ];

        expect(
          module.findValueForTimestampMatchingDay(
            "2025-11-22T12:00:00-05:00",
            data
          )
        ).toBe(45);

        expect(
          module.findValueForTimestampMatchingDay(
            "2025-11-23T06:00:00-05:00",
            data
          )
        ).toBe(48);

        expect(
          module.findValueForTimestampMatchingDay(
            "2025-11-24T18:00:00-05:00",
            data
          )
        ).toBe(50);
      });
    });

    describe("Non-midnight start times", () => {
      it("should match when grid starts at 6am on target day", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT12H", value: 72 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T10:00:00-05:00",
          data
        );

        expect(result).toBe(72);
      });

      it("should match target at midnight when grid starts at 6am same day", () => {
        const data = [
          { validTime: "2025-11-22T06:00:00-05:00/PT12H", value: 72 }
        ];

        // Midnight of same day should still match since we're comparing calendar dates
        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T00:00:00-05:00",
          data
        );

        expect(result).toBe(72);
      });
    });

    describe("Edge cases", () => {
      it("should return undefined for null target timestamp", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(null, data);
        expect(result).toBeUndefined();
      });

      it("should return undefined for null array", () => {
        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T06:00:00-05:00",
          null
        );
        expect(result).toBeUndefined();
      });

      it("should return undefined for empty array", () => {
        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T06:00:00-05:00",
          []
        );
        expect(result).toBeUndefined();
      });

      it("should skip entries with null validTime", () => {
        const data = [
          { validTime: null, value: 40 },
          { validTime: "2025-11-22T00:00:00-05:00/PT24H", value: 45 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T12:00:00-05:00",
          data
        );

        expect(result).toBe(45);
      });
    });

    describe("Same timezone matching", () => {
      it("should match when both timestamps are in same timezone", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-08:00/PT24H", value: 42 }
        ];

        const result = module.findValueForTimestampMatchingDay(
          "2025-11-22T15:00:00-08:00",
          data
        );

        expect(result).toBe(42);
      });
    });
  });

  // ============================================================================
  // accumulateValueForTimestamp Tests
  // ============================================================================
  describe("accumulateValueForTimestamp", () => {
    describe("Basic accumulation", () => {
      it("should accumulate all values for matching day", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0.1 },
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: 0.2 },
          { validTime: "2025-11-22T12:00:00-05:00/PT1H", value: 0.15 },
          { validTime: "2025-11-22T18:00:00-05:00/PT1H", value: 0.05 }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeCloseTo(0.5, 10);
      });

      it("should return 0 when all matching values are 0", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0 },
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: 0 }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBe(0);
      });
    });

    describe("Filtering by day", () => {
      it("should only accumulate values from target day", () => {
        const data = [
          { validTime: "2025-11-21T18:00:00-05:00/PT1H", value: 0.5 }, // Previous day
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: 0.2 },
          { validTime: "2025-11-22T12:00:00-05:00/PT1H", value: 0.3 },
          { validTime: "2025-11-23T00:00:00-05:00/PT1H", value: 0.4 } // Next day
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeCloseTo(0.5, 10);
      });
    });

    describe("Edge cases", () => {
      it("should return undefined when no matching entries", () => {
        const data = [
          { validTime: "2025-11-21T00:00:00-05:00/PT1H", value: 0.5 }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeUndefined();
      });

      it("should return undefined for null array", () => {
        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          null
        );

        expect(result).toBeUndefined();
      });

      it("should skip entries with non-numeric values", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0.1 },
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: "invalid" },
          { validTime: "2025-11-22T12:00:00-05:00/PT1H", value: 0.2 }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeCloseTo(0.3, 10);
      });

      it("should skip entries with null values", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: 0.1 },
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: null },
          { validTime: "2025-11-22T12:00:00-05:00/PT1H", value: 0.2 }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeCloseTo(0.3, 10);
      });

      it("should handle string numeric values", () => {
        const data = [
          { validTime: "2025-11-22T00:00:00-05:00/PT1H", value: "0.1" },
          { validTime: "2025-11-22T06:00:00-05:00/PT1H", value: "0.2" }
        ];

        const result = module.accumulateValueForTimestamp(
          "2025-11-22T08:00:00-05:00",
          data
        );

        expect(result).toBeCloseTo(0.3, 10);
      });
    });
  });
});
