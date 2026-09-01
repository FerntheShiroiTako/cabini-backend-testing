async function loadMe() {
    const res = await fetch("/api/me");
    const data = await res.json();

    const authLink = document.getElementById("authLink");
    const modLink = document.getElementById("modLink");

    if (data.user) {
        authLink.textContent = "Sign out (" + data.user.name + ")";
        authLink.href = "#";
        authLink.addEventListener("click", async (e) => {
            e.preventDefault();
            await fetch("/auth/logout", { method: "POST" });
            location.reload();
        });
        const panelLink = document.getElementById("panelLink");
        if (panelLink) panelLink.classList.remove("hidden");

        if (data.user.role === "moderator" || data.user.isOwner) {
            modLink.classList.remove("hidden");
        }
        if (data.user.isOwner) {
            document.getElementById("ownerLink").classList.remove("hidden");
        }
    } else {
        authLink.textContent = "Sign in";
        authLink.href = "/auth/discord";
    }

    return data;
}
