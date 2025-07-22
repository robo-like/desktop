/**
 * Centralized configuration for RoboLike Desktop
 * Single source of truth for all app configuration
 */

require('dotenv').config();

const config = {
  baseUrl: process.env.BASE_URL || "https://www.robolike.com",

  // API endpoints
  api: {
    auth: {
      status: '/api/auth/status',
    },
    metrics: '/api/metrics'
  },

  // App settings
  app: {
    protocol: 'robolike',
    name: 'RoboLike',
    title: 'RoboLike - Instagram Automation'
  }
};

module.exports = config;