loadMe().then((data) => {
    if (!data.user) return;

    document.getElementById("gate").classList.add("hidden");
    document.getElementById("formCard").classList.remove("hidden");
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const status = document.getElementById("status");
    const btn = document.getElementById("submitBtn");
    const body = new FormData(e.target);

    btn.disabled = true;
    status.textContent = "Uploading...";

    const res = await fetch("/api/posts", { method: "POST", body });
    const data = await res.json();

    if (res.ok) {
        status.textContent = "Submitted. A moderator will review it.";
        e.target.reset();
    } else {
        status.textContent = "Failed: " + data.error;
    }

    if (window.turnstile) turnstile.reset();
    btn.disabled = false;
});
