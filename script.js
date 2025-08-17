window.addEventListener('load', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    const loader = document.getElementById('loader');
    const pathDisplay = document.getElementById('path-display');
    const actionButton = document.getElementById('action-button');

    // This is our primary function for communicating with the bot
    function sendBotCommand(command, data = {}) {
        const message = JSON.stringify({ command, ...data });
        tg.sendData(message);
    }

    // --- Phase 1: Just establish connection ---
    function initialize() {
        loader.classList.add('visible');
        pathDisplay.textContent = "/";
        actionButton.textContent = "Connecting...";
        
        // Send an initial message to the bot to confirm the Web App is open and working
        sendBotCommand('fm_init');
    }
    
    actionButton.addEventListener('click', initialize);

    // For Phase 1, we just show a message received from the bot.
    // In later phases, this will handle file lists.
    tg.onEvent('mainButtonClicked', function() {
        // This is not used in Phase 1 but is here for future use
    });

    // In Phase 1, the bot will send a simple text message back to the main chat.
    // There is no direct way for the bot to send data *to* this web app without a complex server.
    // So, we will use a timeout to simulate a connection success.
    setTimeout(() => {
        loader.classList.remove('visible');
        pathDisplay.textContent = "/"; // Placeholder
        actionButton.textContent = "Connection Established (See Chat)";
        actionButton.disabled = true;
    }, 2000);

    // Automatically initialize on load
    initialize();
});
