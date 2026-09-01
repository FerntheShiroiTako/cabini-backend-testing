loadMe();

async function refresh() {
    const status = document.getElementById("status");
    const rows = document.getElementById("userRows");

    const res = await fetch("/api/owner/users");

    if (res.status === 401 || res.status === 403) {
        status.textContent = "Owner only.";
        return;
    }

    const data = await res.json();
    rows.textContent = "";
    status.textContent = data.users.length + " account(s)";

    for (const user of data.users) {
        const isOwner = user.discord_id === data.ownerDiscordId;
        const tr = document.createElement("tr");

        const name = document.createElement("td");
        name.textContent = user.username;

        const did = document.createElement("td");
        did.textContent = user.discord_id;

        const posts = document.createElement("td");
        posts.textContent = user.post_count;

        const role = document.createElement("td");
        role.textContent = isOwner ? "owner" : user.role;

        const action = document.createElement("td");

        if (isOwner) {
            action.textContent = "set in config";
        } else {
            const next = user.role === "moderator" ? "member" : "moderator";
            const btn = document.createElement("button");
            btn.textContent = next === "moderator" ? "Make moderator" : "Remove moderator";
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                await fetch("/api/owner/users/" + user.id + "/role", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: next }),
                });
                refresh();
            });
            action.append(btn);
        }

        tr.append(name, did, posts, role, action);
        rows.append(tr);
    }
}

refresh();
