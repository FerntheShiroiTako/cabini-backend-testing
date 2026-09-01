loadMe().then((data) => {
    if (!data.user) return;

    document.getElementById("gate").classList.add("hidden");
    document.getElementById("nameCard").classList.remove("hidden");
    document.getElementById("postsCard").classList.remove("hidden");

    const field = document.getElementById("displayName");
    field.value = data.user.displayName || "";
    field.placeholder = data.user.username;

    loadMyPosts();
});

document.getElementById("nameForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const status = document.getElementById("nameStatus");
    const btn = document.getElementById("saveName");
    const value = document.getElementById("displayName").value;

    btn.disabled = true;
    status.textContent = "Saving...";

    const res = await fetch("/api/me/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: value })
    });
    const data = await res.json();

    if (res.ok) {
        status.textContent = "Saved. You are shown as " + data.name + ".";
        const authLink = document.getElementById("authLink");
        if (authLink) authLink.textContent = "Sign out (" + data.name + ")";
    } else {
        status.textContent = "Failed: " + data.error;
    }

    btn.disabled = false;
});

async function loadMyPosts() {
    const status = document.getElementById("postsStatus");
    const list = document.getElementById("myPosts");

    const res = await fetch("/api/me/posts");
    if (!res.ok) {
        status.textContent = "Could not load your submissions.";
        return;
    }

    const data = await res.json();
    list.textContent = "";

    if (!data.posts.length) {
        status.textContent = "You have not submitted any art yet.";
        return;
    }

    const pending = data.posts.filter((p) => p.status === "pending").length;
    const approved = data.posts.length - pending;
    status.textContent = approved + " approved, " + pending + " waiting on a moderator";

    for (const post of data.posts) {
        const card = document.createElement("div");
        card.className = "about";

        const img = document.createElement("img");
        img.src = "/" + post.r2_key;
        img.alt = post.title;
        img.loading = "lazy";

        const title = document.createElement("h3");
        title.textContent = post.title;

        const badge = document.createElement("span");
        badge.className = "badge badge-" + post.status;
        badge.textContent = post.status === "approved" ? "Approved" : "Pending";

        const posted = dateElement(post.created_at);

        card.append(img, title, badge, posted);

        if (post.description) {
            const desc = document.createElement("p");
            desc.textContent = post.description;
            card.append(desc);
        }

        list.append(card);
    }
}
