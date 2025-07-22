/**
 * Analytics event tracking system for RoboLike Desktop
 * Sends events to the analytics API for tracking user behavior
 */

const { app } = require('electron');
const config = require('./config');

class AnalyticsTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.currentAccessToken = null;
    this.platform = this.getPlatform();
    this.appVersion = app.getVersion();
    this.sessionStartTracked = false;
  }

  /**
   * Set the user's access token for authenticated requests
   * @param {string} accessToken - The user's access token
   */
  setAccessToken(accessToken) {
    this.currentAccessToken = accessToken;
  }

  /**
   * Get the current platform
   * @returns {string} Platform identifier
   */
  getPlatform() {
    switch (process.platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        return process.platform;
    }
  }

  /**
   * Create base metadata for events
   * @param {Object} additionalMetadata - Additional metadata to include
   * @returns {Object} Base metadata object
   */
  createBaseMetadata(additionalMetadata = {}) {
    return {
      appVersion: this.appVersion,
      platform: this.platform,
      ...additionalMetadata
    };
  }

  /**
   * Generate a session ID for analytics tracking
   * @returns {string} Session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Send an analytics event to the API using session cookies
   * @param {string} eventType - The type of event
   * @param {Object} metadata - Event metadata to store as JSON string
   * @returns {Promise<boolean>} Success status
   */
  async sendEvent(eventType, metadata = {}) {
    try {
      const { net, session } = require('electron');

      // Format the payload according to API requirements
      const payload = {
        path: '/desktop-app', // Path for desktop app events
        sessionId: this.getSessionId(),
        eventType: eventType,
        eventValue: JSON.stringify(metadata)
      };

      const request = net.request({
        method: 'POST',
        url: `${config.baseUrl}${config.api.metrics}`,
        useSessionCookies: true,
        session: session.defaultSession,
      });

      request.setHeader('Content-Type', 'application/json');

      return new Promise((resolve) => {
        request.on('response', (response) => {
          let body = '';
          response.on('data', (chunk) => {
            body += chunk;
          });
          response.on('end', () => {
            if (response.statusCode === 200) {
              console.log('Analytics: Event sent successfully', eventType);
              resolve(true);
            } else {
              console.error('Analytics: Failed to send event', response.statusCode);
              console.error('Analytics: Response body:', body);
              console.error('Analytics: Payload:', JSON.stringify(payload, null, 2));
              resolve(false);
            }
          });
        });

        request.on('error', (error) => {
          console.error('Analytics: Error sending event', error);
          resolve(false);
        });

        request.write(JSON.stringify(payload));
        request.end();
      });
    } catch (error) {
      console.error('Analytics: Error sending event', error);
      return false;
    }
  }

  /**
   * Track app session start
   */
  async trackAppSessionStart() {
    const metadata = this.createBaseMetadata({
      action: 'launch',
      description: 'Desktop app launched'
    });

    await this.sendEvent('appSessionStart', metadata);
  }

  /**
   * Track app session end
   */
  async trackAppSessionEnd() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    const metadata = this.createBaseMetadata({
      action: 'close',
      description: 'Desktop app closed',
      sessionDuration
    });

    await this.sendEvent('appSessionEnd', metadata);
  }

  /**
   * Track app login
   * @param {string} method - Login method (accessToken, magicLink)
   */
  async trackAppLogin(method = 'accessToken') {
    const metadata = this.createBaseMetadata({
      action: 'success',
      description: 'User logged into desktop app',
      loginMethod: method
    });

    await this.sendEvent('appLogin', metadata);
  }

  /**
   * Track likes started
   * @param {Object} options - Likes configuration
   */
  async trackLikesStarted(options = {}) {
    const metadata = this.createBaseMetadata({
      action: 'hashtag',
      description: 'User started liking posts',
      targetHashtag: options.hashtag || null,
      likesPerMinute: 1, // 1 like per minute based on current implementation
      maxLikes: options.maxLikes || 500
    });

    await this.sendEvent('likesStarted', metadata);
  }

  /**
   * Track likes stopped
   * @param {string} reason - Reason for stopping (manual, completed, error, rateLimit)
   * @param {number} totalLikes - Total likes performed
   * @param {number} duration - Duration in seconds
   */
  async trackLikesStopped(reason, totalLikes, duration) {
    const metadata = this.createBaseMetadata({
      action: reason,
      description: 'User stopped liking posts',
      totalLikes,
      duration,
      reason
    });

    await this.sendEvent('likesStopped', metadata);
  }

  /**
   * Track individual post liked
   * @param {Object} postData - Post information
   */
  async trackPostLiked(postData) {
    const metadata = this.createBaseMetadata({
      action: 'hashtag',
      description: 'Successfully liked a post',
      postId: postData.id || null,
      hashtag: postData.hashtag || null,
      likesCount: postData.likesCount || null
    });

    await this.sendEvent('postLiked', metadata);
  }

  /**
   * Track app error
   * @param {string} errorType - Type of error (rateLimit, authFailed, networkError)
   * @param {string} errorMessage - Error message
   * @param {string} errorCode - Error code if available
   */
  async trackAppError(errorType, errorMessage, errorCode = null) {
    const metadata = this.createBaseMetadata({
      action: errorType,
      description: errorMessage,
      errorCode,
      errorMessage
    });

    await this.sendEvent('appError', metadata);
  }
}

// Create global instance
const analytics = new AnalyticsTracker();

module.exports = analytics;