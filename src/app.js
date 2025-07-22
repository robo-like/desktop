let BASE_URL;
let config;
const MAX_LIKES_PER_DAY = 500;
const MAX_LIKES_TO_STORE = MAX_LIKES_PER_DAY * 3;

// Initialize config asynchronously
async function initConfig() {
  BASE_URL = await window.electronAPI.getBaseUrl();
  config = await window.electronAPI.getConfig();
}

// Initialize config when the page loads
initConfig();

let likes;
try {
  likes = JSON.parse(localStorage.getItem("likes")) || [];
} catch (err) {
  likes = [];
}

const instagramWebview = document.getElementById("instagramWebview");

const btnStart = document.getElementById("btnStart");
const inputHashtag = document.getElementById("inputHashtag");

inputHashtag.value = localStorage.getItem("hashtag");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");

inputHashtag.value = localStorage.getItem("hashtag");
startTime.value = localStorage.getItem("startTime") || "00:00";
endTime.value = localStorage.getItem("endTime") || "23:59";

let likeInterval;
let likesStartTime = null;
let likesCount = 0;

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

/**
 * Check if user is currently logged into Instagram
 * @returns {Promise<boolean>} - True if logged in, false otherwise
 */
async function isLoggedIntoInstagram() {
  try {
    const result = await instagramWebview.executeJavaScript(`
      (function() {
        // First check if we're on the login page
        const loginForm = document.querySelector('input[name="username"]') || 
                         document.querySelector('input[name="password"]') ||
                         document.querySelector('form[method="post"]') ||
                         document.querySelector('button[type="submit"]');
        if (loginForm && (
          window.location.pathname === '/accounts/login/' ||
          window.location.pathname === '/accounts/login' ||
          window.location.pathname === '/login' ||
          window.location.pathname === '/login/'
        )) {
          return false;
        }
        
        // Check for logged in indicators (simpler approach)
        const loggedInIndicators = [
          // Navigation elements that only appear when logged in
          'nav a[href="/"]', // Home link in nav
          'nav a[href*="/direct/"]', // Messages
          'nav a[href*="/explore/"]', // Explore
          'nav a[href*="/accounts/activity/"]', // Activity
          'nav a[href*="/accounts/edit/"]', // Settings
          'a[href="/accounts/logout/"]', // Logout link
          'div[data-testid="user-avatar"]', // User avatar
          'nav img[alt*="profile picture"]', // Profile picture
          'svg[aria-label="Home"]', // Home icon
          'svg[aria-label="New post"]', // New post icon
          'svg[aria-label="Find People"]', // Find people icon
          'svg[aria-label="Activity Feed"]', // Activity icon
        ];
        
        // If any logged in indicator is found, user is logged in
        for (const selector of loggedInIndicators) {
          if (document.querySelector(selector)) {
            console.log('Found logged in indicator:', selector);
            return true;
          }
        }
        
        // Check if we're on a page that requires authentication
        // and we're not seeing a login form
        const requiresAuth = window.location.pathname === '/' ||
                           window.location.pathname.includes('/p/') ||
                           window.location.pathname.includes('/reel/') ||
                           window.location.pathname.includes('/explore/') ||
                           window.location.pathname.includes('/direct/');
        
        if (requiresAuth && !loginForm) {
          return true;
        }
        
        return false;
      })();
    `);

    console.log('Instagram login check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking Instagram login status:', error);
    return false;
  }
}

// Add this function to update the table
function updateLikesTable() {
  const tbody = document.querySelector("#likesTable tbody");
  tbody.innerHTML = "";

  for (let i = likes.length - 1; i >= 0; i--) {
    const like = likes[i];
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding: 8px; border: 1px solid #ddd;">${new Date(
      like.createdAt
    ).toLocaleString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;"><a href="${like.permalink
      }" target="_blank">View</a></td>
      <td style="padding: 8px; border: 1px solid #ddd;">${like.caption
        ? like.caption.length > 100
          ? like.caption.substring(0, 100) + "..."
          : like.caption
        : "No caption"
      }</td>
    `;
    tbody.appendChild(row);
  }
}

// Call updateLikesTable initially
updateLikesTable();

// Countdown function
function startCountdown() {
  let secondsLeft = 60;
  const countdownText = document.getElementById("countdownText");

  function updateCountdown() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    countdownText.textContent = `Next action in: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (secondsLeft <= 0) {
      secondsLeft = 60; // Reset to 60 seconds for next cycle
    } else {
      secondsLeft--;
    }
  }

  // Update immediately
  updateCountdown();

  // Update every second
  countdownInterval = setInterval(updateCountdown, 1000);
}

// Sidebar resize functionality
function initializeSidebarResize() {
  const sidebar = document.querySelector('.sidebar');
  const resizeHandle = document.querySelector('.resize-handle');
  const resizeOverlay = document.querySelector('.resize-overlay');

  // Load saved width from localStorage
  const savedWidth = localStorage.getItem('sidebarWidth');
  if (savedWidth) {
    sidebar.style.width = savedWidth + 'px';
  }

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);

    // Show overlay to capture all mouse events
    resizeOverlay.style.display = 'block';

    // Add event listeners to the overlay instead of document
    resizeOverlay.addEventListener('mousemove', handleMouseMove);
    resizeOverlay.addEventListener('mouseup', handleMouseUp);

    e.preventDefault();
  });

  function handleMouseMove(e) {
    if (!isResizing) return;

    const newWidth = startWidth + (e.clientX - startX);
    const minWidth = 420;
    const maxWidth = 1200;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      sidebar.style.width = newWidth + 'px';
    }
  }

  function handleMouseUp() {
    if (isResizing) {
      isResizing = false;

      // Hide overlay
      resizeOverlay.style.display = 'none';

      // Save the new width to localStorage
      const currentWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
      localStorage.setItem('sidebarWidth', currentWidth);

      // Remove event listeners from overlay
      resizeOverlay.removeEventListener('mousemove', handleMouseMove);
      resizeOverlay.removeEventListener('mouseup', handleMouseUp);
    }
  }
}

// Initialize sidebar resize on page load
initializeSidebarResize();

/**
 * Update UI elements based on Instagram login status
 */
let wasLoggedIn = false;

async function updateLoginStatusUI() {
  const isLoggedIn = await isLoggedIntoInstagram();
  const loginMessage = document.querySelector('.login-message');
  const mainContent = document.getElementById('mainContent');
  const webviewHeader = document.querySelector('.webview-header');

  if (!loginMessage || !mainContent) {
    setTimeout(updateLoginStatusUI, 500);
    return;
  }

  // Track login event when user goes from not logged in to logged in
  if (isLoggedIn && !wasLoggedIn) {
    await window.electronAPI.analytics.trackAppLogin('instagram');
    wasLoggedIn = true;
  } else if (!isLoggedIn) {
    wasLoggedIn = false;
  }

  if (isLoggedIn) {
    setTimeout(updateLoginStatusUI, 5000);
    loginMessage.style.display = 'none';
    mainContent.style.display = 'flex';
    if (webviewHeader) {
      webviewHeader.style.display = 'none';
    }
  } else {
    setTimeout(updateLoginStatusUI, 800);
    loginMessage.style.display = 'block';
    mainContent.style.display = 'none';
    if (webviewHeader) {
      webviewHeader.style.display = 'block';
    }
  }
}

// Check login status periodically and update UI
// Wait for config to be initialized before checking login status
initConfig().then(() => {
  updateLoginStatusUI(); // Check immediately on load
});

// Back to Profile breadcrumb functionality
document.getElementById('backToProfileLink').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!BASE_URL) {
    await initConfig();
  }
  window.location.href = `${BASE_URL}/u/profile`;
});


function isWithinTimeRange() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = startTime.value.split(":").map(Number);
  const [endHour, endMinute] = endTime.value.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentTime >= startMinutes && currentTime <= endMinutes;
}

let countdownInterval;

btnStart.addEventListener("click", async () => {
  if (!likeInterval) {
    const selectedHashtag = inputHashtag.value;
    localStorage.setItem("hashtag", selectedHashtag);

    localStorage.setItem("startTime", startTime.value);
    localStorage.setItem("endTime", endTime.value);

    // Track likes started
    likesStartTime = Date.now();
    likesCount = 0;
    await window.electronAPI.analytics.trackLikesStarted({
      hashtag: selectedHashtag,
      maxLikes: MAX_LIKES_PER_DAY
    });

    // Update button to stop state
    btnStart.innerText = "Stop Automation";
    btnStart.className = "btn-stop";

    // Show status section
    const statusSection = document.getElementById("statusSection");
    statusSection.style.display = "block";

    // Start countdown
    startCountdown();

    const likePost = async () => {
      if (!isWithinTimeRange()) {
        return;
      }

      // Ensure config is loaded
      if (!BASE_URL) {
        await initConfig();
      }

      const todayLikes = likes.filter((like) => {
        const likeDate = new Date(like.timestamp);
        const today = new Date();
        return likeDate.toDateString() === today.toDateString();
      });

      if (todayLikes.length >= MAX_LIKES_PER_DAY) {
        return;
      }

      // Use proxied API call through main process
      const recentMediaResponse = await window.electronAPI.instagram.getRecentMedia(selectedHashtag);

      // Handle errors
      if (recentMediaResponse.status === 401) {
        await window.electronAPI.analytics.trackAppError('authFailed', 'Unauthorized access to Instagram API', '401');
        alert("Unauthorized");
        return;
      }

      if (recentMediaResponse.status === 402) {
        await window.electronAPI.analytics.trackAppError('paymentRequired', 'Payment required for Instagram API', '402');
        alert("Payment required");
        return;
      }

      if (recentMediaResponse.status !== 200) {
        await window.electronAPI.analytics.trackAppError('networkError', `API request failed with status ${recentMediaResponse.status}`, recentMediaResponse.status.toString());
        alert(`API request failed: ${recentMediaResponse.error || 'Unknown error'}`);
        return;
      }

      const data = recentMediaResponse.data;
      if (data.posts) {
        const postToLike = data.posts.find(
          (post) => !likes.some((like) => like.id === post.id)
        );

        if (!postToLike) {
          return;
        }

        await instagramWebview.executeJavaScript(`
            window.history.pushState({}, "", new URL("${postToLike.permalink}").pathname);
            window.dispatchEvent(new PopStateEvent("popstate"));
            
            
            setTimeout(() => {
              const likeButton = document.querySelector('div > section > div > span > div > div > div svg[aria-label="Like"]');
              if (likeButton) {
                likeButton.parentElement.click();
              }
            }, 3000);
        `);

        if (likes.length >= MAX_LIKES_TO_STORE) {
          likes = likes.slice(-MAX_LIKES_TO_STORE + 1);
        }
        likes.push({
          ...postToLike,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("likes", JSON.stringify(likes));
        updateLikesTable();

        // Track individual post liked
        likesCount++;
        await window.electronAPI.analytics.trackPostLiked({
          id: postToLike.id,
          hashtag: selectedHashtag,
          likesCount: postToLike.like_count
        });
      }
    };

    // Run immediately and then every minute
    likePost();
    likeInterval = setInterval(likePost, 60000);
  } else {
    // Track likes stopped
    const duration = Math.floor((Date.now() - likesStartTime) / 1000);
    await window.electronAPI.analytics.trackLikesStopped('manual', likesCount, duration);

    // Stop the interval
    clearInterval(likeInterval);
    likeInterval = null;

    // Stop countdown
    clearInterval(countdownInterval);
    countdownInterval = null;

    // Update button to start state
    btnStart.innerText = "Start Automation";
    btnStart.className = "btn-primary";

    // Hide status section
    const statusSection = document.getElementById("statusSection");
    statusSection.style.display = "none";
  }
});
