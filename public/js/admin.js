loadMe();

function postCard(post, buttons) {
    const card = document.createElement("div");
    card.className = "about";

    const img = document.createElement("img");
    img.src = "/" + post.r2_key;
    img.alt = post.title;
    img.loading = "lazy";

    const title = document.createElement("h3");
    title.textContent = post.title;

    const by = document.createElement("p");
    by.textContent = "by " + post.username;

    const desc = document.createElement("p");
    desc.textContent = post.description || "";

    card.append(img, title, by, dateElement(post.created_at), desc);
    for (const b of buttons) card.append(b);
    return card;
}

async function removePost(id, message) {
    if (!confirm(message)) return false;
    const res = await fetch("/api/admin/posts/" + id, { method: "DELETE" });
    return res.ok;
}

async function loadPending() {
    const status = document.getElementById("pendingStatus");
    const queue = document.getElementById("queue");

    const res = await fetch("/api/admin/posts?status=pending");

    if (res.status === 401 || res.status === 403) {
        status.textContent = "Moderators only.";
        return false;
    }

    const data = await res.json();
    queue.textContent = "";
    status.textContent = data.posts.length ? data.posts.length + " waiting" : "Queue is empty.";

    for (const post of data.posts) {
        const approve = document.createElement("button");
        approve.textContent = "Approve";
        approve.addEventListener("click", async () => {
            approve.disabled = true;
            await fetch("/api/admin/posts/" + post.id + "/approve", { method: "POST" });
            refresh();
        });

        const reject = document.createElement("button");
        reject.textContent = "Reject";
        reject.addEventListener("click", async () => {
            if (await removePost(post.id, "Delete this submission permanently?")) refresh();
        });

        queue.append(postCard(post, [approve, reject]));
    }

    return true;
}

async function loadPublished() {
    const status = document.getElementById("publishedStatus");
    const published = document.getElementById("published");

    const res = await fetch("/api/admin/posts?status=approved");
    if (!res.ok) return;

    const data = await res.json();
    published.textContent = "";
    status.textContent = data.posts.length ? data.posts.length + " live" : "Nothing published yet.";

    for (const post of data.posts) {
        const remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
            if (await removePost(post.id, "Delete this published post? It will disappear from the gallery.")) refresh();
        });

        published.append(postCard(post, [remove]));
    }
}

async function refresh() {
    if (await loadPending()) {
        loadPublished();
    } else {
        document.getElementById("publishedStatus").textContent = "Moderators only.";
    }
}

refresh();
