window.addEventListener('load', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    const loader = document.getElementById('loader');
    const pathDisplay = document.getElementById('path-display');
    const fileList = document.getElementById('file-list');
    const footer = document.getElementById('footer');
    const upButton = document.getElementById('up-button');
    const uploadButton = document.getElementById('upload-button');
    const initialScreen = document.getElementById('initial-screen');
    const grantAccessButton = document.getElementById('grant-access-button');

    function sendBotCommand(command, data = {}) {
        tg.sendData(JSON.stringify({ command, ...data }));
    }

    function renderFileList(data) {
        fileList.innerHTML = '';
        
        if (data.error) {
            if (data.error === "grant_needed") {
                showInitialScreen("Storage access has not been granted on the device. Please request it.");
            } else {
                showInitialScreen(data.error);
            }
            return;
        }

        pathDisplay.textContent = data.path || '/';
        
        if (data.items.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'item';
            emptyItem.innerHTML = `<span class="item-icon">🤷</span> <span class="item-name">Directory is empty.</span>`;
            fileList.appendChild(emptyItem);
        }

        data.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `<span class="item-icon">${item.type === 'folder' ? '📁' : '📄'}</span><span class="item-name">${item.name}</span>`;
            itemDiv.addEventListener('click', () => handleItemClick(item));
            fileList.appendChild(itemDiv);
        });

        footer.classList.remove('hidden');
        upButton.classList.toggle('hidden', !data.parentUri);
        upButton.dataset.uri = data.parentUri || '';
    }
    
    function handleItemClick(item) {
        if (item.type === 'folder') {
            showLoader("Loading folder...");
            sendBotCommand('fm_list_files', { uri: item.uri });
            tg.close();
        } else {
            tg.showPopup({
                title: item.name,
                message: 'Select an action for this file.',
                buttons: [
                    { id: 'download', text: '⬇️ Download' },
                    { id: 'delete', text: '❌ Delete' },
                    { type: 'cancel' }
                ]
            }, (buttonId) => {
                if (buttonId === 'download') {
                    sendBotCommand('fm_download_file', { uri: item.uri });
                    tg.showAlert('Download request sent to the device.');
                } else if (buttonId === 'delete') {
                    tg.showConfirm(`Are you sure you want to delete "${item.name}"?`, (confirmed) => {
                        if (confirmed) {
                            showLoader("Deleting file...");
                            sendBotCommand('fm_delete_file', { uri: item.uri });
                            tg.close();
                        }
                    });
                }
            });
        }
    }

    function parseUrlData() {
        if (location.hash && location.hash.startsWith('#data=')) {
            try {
                const encodedData = location.hash.substring(6);
                const jsonData = atob(encodedData);
                const data = JSON.parse(jsonData);
                
                hideLoader();
                renderFileList(data);

            } catch (e) {
                console.error("Failed to parse data:", e);
                showInitialScreen("Error: Could not parse data from bot.");
            }
        } else {
            sendBotCommand('fm_init');
            tg.close();
        }
    }
    
    function showLoader(message = "Connecting to device...") {
        loader.classList.remove('hidden');
        loader.querySelector('p').textContent = message;
        fileList.classList.add('hidden');
        initialScreen.classList.add('hidden');
        footer.classList.add('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
        fileList.classList.remove('hidden');
    }

    function showInitialScreen(message = "Grant storage access on the device to begin.") {
        hideLoader();
        fileList.classList.add('hidden');
        footer.classList.add('hidden');
        initialScreen.classList.remove('hidden');
        initialScreen.querySelector('p').textContent = message;
    }
    
    upButton.addEventListener('click', () => {
        const parentUri = upButton.dataset.uri;
        if (parentUri) {
            showLoader("Loading parent directory...");
            sendBotCommand('fm_list_files', { uri: parentUri });
            tg.close();
        }
    });

    grantAccessButton.addEventListener('click', () => {
        sendBotCommand('fm_grant_access');
        tg.close();
    });

    uploadButton.addEventListener('click', () => {
        sendBotCommand('fm_upload_file');
        tg.close();
    });

    parseUrlData();
});
