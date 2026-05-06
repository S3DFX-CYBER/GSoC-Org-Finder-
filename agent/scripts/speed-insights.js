/**
 * Vercel Speed Insights initialization
 * Automatically tracks web vitals and performance metrics
 */
import { injectSpeedInsights } from './speed-insights-lib.mjs';

// Initialize Speed Insights
// Note: This only tracks in production, not in development mode
injectSpeedInsights({
  debug: false, // Set to true to enable debug logging
});
