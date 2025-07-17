const BASE_URL = window.electronAPI.getBaseUrl();
const MAX_LIKES_PER_DAY = 500;
const MAX_LIKES_TO_STORE = MAX_LIKES_PER_DAY * 3;

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
        // Check for elements that indicate user is logged in
        const loginIndicators = [
          // Profile button/navbar elements
          'nav[role="navigation"] a[href*="/accounts/activity/"]',
          'nav[role="navigation"] a[href*="/accounts/edit/"]',
          'nav[role="navigation"] a[href*="/accounts/"]',
          // Direct message button
          'a[href="/direct/inbox/"]',
          // Create post button
          'a[href="/create/select/"]',
          // Activity button
          'a[href="/accounts/activity/"]',
          // Profile picture in nav
          'nav img[alt*="profile picture"]',
          // Logged in specific elements
          'div[data-testid="user-avatar"]',
          // Check if we're not on login page
          'input[name="username"]',
          'input[name="password"]'
        ];
        
        // If we find login form elements, we're not logged in
        const loginForm = document.querySelector('input[name="username"]') || 
                         document.querySelector('input[name="password"]');
        if (loginForm) {
          return false;
        }
        
        // Check for logged in indicators
        for (const selector of loginIndicators) {
          if (selector.includes('input[name=')) {
            continue; // Skip login form selectors
          }
          if (document.querySelector(selector)) {
            return true;
          }
        }
        
        // Additional check: look for logout button or user menu
        const logoutButton = document.querySelector('a[href="/accounts/logout/"]') ||
                           document.querySelector('button[data-testid="logout-button"]');
        if (logoutButton) {
          return true;
        }
        
        // Check if we're on a page that requires login (like feed)
        const isOnFeed = window.location.pathname === '/' || 
                        window.location.pathname.includes('/p/') ||
                        window.location.pathname.includes('/reel/');
        
        // If we're on feed but no login indicators found, assume not logged in
        return false;
      })();
    `);

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
async function updateLoginStatusUI() {
  const isLoggedIn = await isLoggedIntoInstagram();
  const loginMessage = document.querySelector('.login-message');
  const mainContent = document.getElementById('mainContent');
  const webviewHeader = document.querySelector('.webview-header');
  const breadcrumb = document.querySelector('.breadcrumb');

  if (!loginMessage || !mainContent) {
    setTimeout(updateLoginStatusUI, 500);
    return;
  }

  if (isLoggedIn) {
    setTimeout(updateLoginStatusUI, 5000);
    loginMessage.style.display = 'none';
    mainContent.style.display = 'flex';
    if (webviewHeader) {
      webviewHeader.style.display = 'none';
    }
    if (breadcrumb) {
      breadcrumb.style.display = 'flex';
    }
  } else {
    setTimeout(updateLoginStatusUI, 800);
    loginMessage.style.display = 'block';
    mainContent.style.display = 'none';
    if (webviewHeader) {
      webviewHeader.style.display = 'block';
    }
    if (breadcrumb) {
      breadcrumb.style.display = 'none';
    }
  }
}

// Check login status periodically and update UI
updateLoginStatusUI(); // Check immediately on load

// Back to Profile breadcrumb functionality
document.getElementById('backToProfileLink').addEventListener('click', (e) => {
  e.preventDefault();
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
    const accessToken = new URLSearchParams(window.location.search).get(
      "accessToken"
    );

    localStorage.setItem("startTime", startTime.value);
    localStorage.setItem("endTime", endTime.value);

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

      const todayLikes = likes.filter((like) => {
        const likeDate = new Date(like.timestamp);
        const today = new Date();
        return likeDate.toDateString() === today.toDateString();
      });

      if (todayLikes.length >= MAX_LIKES_PER_DAY) {
        return;
      }

      const recentMediaResponse = await fetch(
        `${BASE_URL}/api/instagram/hashtag/${selectedHashtag}/recent`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Unauthorized
      if (recentMediaResponse.status === 401) {
        alert("Unauthorized");
        return;
      }

      // Payment required
      if (recentMediaResponse.status === 402) {
        alert("Payment required");
        return;
      }

      const data = await recentMediaResponse.json();
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
      }
    };

    // Run immediately and then every minute
    likePost();
    likeInterval = setInterval(likePost, 60000);
  } else {
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
