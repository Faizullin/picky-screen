document.getElementById("use-gpt").addEventListener("change", (e) => {
    document.getElementById("prompt-field").style.display = e.target.checked ? "block" : "none";
});

document.getElementById("save-settings").addEventListener("click", () => {
    const settings = {
        useTelegram: document.getElementById("use-telegram").checked,
        useGpt: document.getElementById("use-gpt").checked,
        gptPrompt: document.getElementById("gpt-prompt").value,
    };
    localStorage.setItem("user-settings", JSON.stringify(settings));
    alert("Settings saved!");
});
