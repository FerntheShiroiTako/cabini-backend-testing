function formatDate(iso) {
    if (!iso) return "";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function dateElement(iso) {
    const el = document.createElement("p");
    el.className = "posted";
    el.textContent = formatDate(iso);
    el.title = iso ? new Date(iso).toString() : "";
    return el;
}
