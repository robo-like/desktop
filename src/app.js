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

let likeInterval;

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
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
      <td style="padding: 8px; border: 1px solid #ddd;"><a href="${
        like.permalink
      }" target="_blank">View</a></td>
      <td style="padding: 8px; border: 1px solid #ddd;">${
        like.caption
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

btnStart.addEventListener("click", async () => {
  if (!likeInterval) {
    const selectedHashtag = inputHashtag.value;
    localStorage.setItem("hashtag", selectedHashtag);

    // Start the interval
    btnStart.innerText = "Stop";

    const likePost = async () => {
      const todayLikes = likes.filter((like) => {
        const likeDate = new Date(like.timestamp);
        const today = new Date();
        return likeDate.toDateString() === today.toDateString();
      });

      if (todayLikes.length >= MAX_LIKES_PER_DAY) {
        return;
      }

      const res = await fetch(
        `https://beta.robolike.com/api/instagram/hashtag/${selectedHashtag}/recent`
      );
      const data = await res.json();
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
    btnStart.innerText = "Start";
  }
});
