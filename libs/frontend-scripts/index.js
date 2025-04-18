const contentEl = document.getElementById('main-content')

window.electronAPI.onUpdateContent((value) => {
    if (value.type === "single-message") {
        contentEl.innerText = value.data.content.trim();
    } else {
        throw new Error("Invalid message type");
    }
})