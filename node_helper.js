/*********************************

  Node Helper for MMM-NOAAForecastDeluxe.

  This helper is responsible for the DarkSky-compatible data pull from NOAA.

  Sample API:

    e.g. https://api.weather.gov/points/40.8932469,-74.0116536

*********************************/

var NodeHelper = require("node_helper");
var needle = require("needle");
var moment = require("moment");

module.exports = NodeHelper.create({
  start: function () {
    console.log(
      `Starting node_helper for module ${this.name}`
    );
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NOAA_CALL_FORECAST_GET") {
      var self = this;
      // use a browser-like User-Agent for requests
      var needleOptions = {
        follow_max: 3
      };

      if (
        payload.latitude === null ||
        payload.latitude === "" ||
        payload.longitude === null ||
        payload.longitude === ""
      ) {
        console.log(
          `[MMM-NOAAForecastDeluxe] ${moment().format(
            "D-MMM-YY HH:mm"
          )} ** ERROR ** Latitude and/or longitude not provided.`
        );
      } else {
        var url = `https://api.weather.gov/points/${payload.latitude},${payload.longitude}`;

        console.log(`[MMM-NOAAForecastDeluxe] Getting data: ${url}`);
        needle.get(url, needleOptions, function (error, response, body) {
          if (error || response.statusCode !== 200) {
            console.error(
              `[MMM-NOAAForecastDeluxe] ${moment().format(
                "D-MMM-YY HH:mm"
              )} ** ERROR ** Failed to get forecast URLs: ${error ? error.message : "HTTP Status Code " + response.statusCode}`
            );
            return;
          }

          let parsedBody;
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            console.error(
              `[MMM-NOAAForecastDeluxe] ${moment().format(
                "D-MMM-YY HH:mm"
              )} ** ERROR ** Failed to parse response body as JSON: ${e.message}`
            );
            return;
          }
          
          if (parsedBody && parsedBody.properties && parsedBody.properties.forecastHourly) {
            var forecastUrls = [{
              key: "hourly",
              url: parsedBody.properties.forecastHourly
            }, {
              key: "daily",
              url: parsedBody.properties.forecast
            }, {
              key: "grid",
              url: parsedBody.properties.forecastGridData
            }];

            var forecastData = {};
            var completedRequests = 0;
            forecastUrls.forEach(function (item) {
              console.log(`[MMM-NOAAForecastDeluxe] Making request for ${item.key}: ${item.url}`);
              needle.get(item.url, needleOptions, function (err, res, data) {
                console.log(`[MMM-NOAAForecastDeluxe] Received data for ${item.key}. Data type: ${typeof data}`);
                if (!err && res.statusCode === 200) {
                  try {
                    forecastData[item.key] = JSON.parse(data);
                  } catch (parseError) {
                    console.log(
                      `[MMM-NOAAForecastDeluxe] ${moment().format(
                        "D-MMM-YY HH:mm"
                      )} ** ERROR ** Failed to parse JSON for ${item.key}: ${parseError.message}`
                    );
                  }
                } else {
                  console.log(
                    `[MMM-NOAAForecastDeluxe] ${moment().format(
                      "D-MMM-YY HH:mm"
                    )} ** ERROR ** Failed to get ${item.key}: ${err}`
                  );
                }

                completedRequests++;
                if (completedRequests === forecastUrls.length) {
                  console.log("[MMM-NOAAForecastDeluxe] All forecast data fetched. Sending to main module.");
//                  console.log("[MMM-NOAAWeatherForecast] Final payload:", JSON.stringify(forecastData));
                  self.sendSocketNotification("NOAA_CALL_FORECAST_DATA", {
                    instanceId: payload.instanceId,
                    payload: forecastData
                  });
                }
              });
            });
          } else {
            console.error(
              `[MMM-NOAAForecastDeluxe] ${moment().format(
                "D-MMM-YY HH:mm"
              )} ** ERROR ** API response does not contain forecast URLs.`
            );
          }
        });
      }
    }
  }
});
