loadMe();

fetch("/api/posts")
    .then((res) => res.json())
    .then((data) => {
        const status = document.getElementById("status");
        const grid = document.getElementById("gallery");

        if (!data.posts.length) {
            status.textContent = "No art yet. Be the first.";
            return;
        }

        status.textContent = data.posts.length + " piece(s) of art";

        for (const post of data.posts) {
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

            card.append(img, title, by, dateElement(post.created_at));

            if (post.description) {
                const desc = document.createElement("p");
                desc.textContent = post.description;
                card.append(desc);
            }

            grid.append(card);
        }
    });
