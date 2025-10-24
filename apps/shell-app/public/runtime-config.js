(function () {
  "use strict";
  const hostname = window.location.hostname;
  let config;
  if (hostname === "localhost") {
    config = {
      baseUrl: "http://localhost:5258",
      defaultBusinessUnit: "HEMA",
      production: false,
      appVersion: "3.0.0",
      enableLogging: true,
      sessionTimeout: 30,
      tokenRefreshThreshold: 5,
      maxTabs: 10,
      cacheMenus: true,
      cacheDuration: 30,
      enableNotifications: true,
      apiTimeout: 60000,
      signalrReconnectDelay: 5000,
    };
  } else {
    // Production configuration
    config = {
      baseUrl: window.location.origin,
      defaultBusinessUnit: "HEMA",
      production: true,
      appVersion: "3.0.0",
      enableLogging: false,
      sessionTimeout: 30,
      tokenRefreshThreshold: 5,
      maxTabs: 5,
      cacheMenus: true,
      cacheDuration: 30,
      enableNotifications: true,
      apiTimeout: 30000,
      signalrReconnectDelay: 10000,
    };
  }
  window.RUNTIME_CONFIG = config;
  console.log("Runtime configuration loaded for:", hostname);
})();
