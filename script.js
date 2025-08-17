window.addEventListener('load', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    const loader = document.getElementById('loader');
    const pathDisplay = document.getElementById('path-display');
    const fileList = document.getElementById('file-list');
    const footer = document.getElementById('footer');
    const upButton = document.getElementById('up-button');
    const initialScreen = document.getElementById('initial-screen');
    const grantAccessButton = document.getElementById('grant-access-button');

    function sendBotCommand(command, data = {}) {
        tg.sendData(JSON.stringify({ command, ...data }));
    }

    function renderFileList(data) {
        fileList.innerHTML = ''; // Clear previous list
        
        if (data.error) {
            pathDisplay.textContent = 'Error';
            const errorItem = document.createElement('div');
            errorItem.className = 'item';
            errorItem.textContent = data.error;
            fileList.appendChild(errorItem);
            return;
        }

        pathDisplay.textContent = data.path || '/';
        
        if (data.items.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'item';
            emptyItem.textContent = 'Directory is empty.';
            fileList.appendChild(emptyItem);
        }

        data.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'item-icon';
            iconSpan.textContent = item.type === 'folder' ? '📁' : '📄';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = item.name;

            itemDiv.appendChild(iconSpan);
            itemDiv.appendChild(nameSpan);

            itemDiv.addEventListener('click', () => {
                if (item.type === 'folder') {
                    loader.classList.remove('hidden');
                    fileList.classList.add('hidden');
                    sendBotCommand('fm_list_files', { uri: item.uri });
                } else {
                    // Phase 3: Implement file download
                    tg.showPopup({
                        title: 'File Action',
                        message: `Do you want to download "${item.name}"?`,
                        buttons: [
                            { id: 'download', text: 'Download Now' },
                            { type: 'cancel' }
                        ]
                    }, (buttonId) => {
                        if (buttonId === 'download') {
                            tg.MainButton.setText('Requesting Download...').show().disable();
                            sendBotCommand('fm_download_file', { uri: item.uri });
                        }
                    });
                }
            });
            fileList.appendChild(itemDiv);
        });

        footer.classList.toggle('hidden', !data.parentUri);
        upButton.dataset.uri = data.parentUri || '';
    }
    
    function parseUrlData() {
        if (location.hash && location.hash.startsWith('#data=')) {
            try {
                const encodedData = location.hash.substring(6);
                const jsonData = atob(encodedData);
                const data = JSON.parse(jsonData);
                
                initialScreen.classList.add('hidden');
                loader.classList.add('hidden');
                fileList.classList.remove('hidden');
                renderFileList(data);

            } catch (e) {
                console.error("Failed to parse data from URL hash:", e);
                showInitialScreen("Error parsing data from bot.");
            }
        } else {
            // No data in URL, this is the initial launch
            sendBotCommand('fm_init');
            showInitialScreen();
        }
    }
    
    function showInitialScreen(message = "Grant storage access on the device to begin.") {
        loader.classList.add('hidden');
        fileList.classList.add('hidden');
        initialScreen.classList.remove('hidden');
        initialScreen.querySelector('p').textContent = message;
    }
    
    upButton.addEventListener('click', () => {
        const parentUri = upButton.dataset.uri;
        if (parentUri) {
            loader.classList.remove('hidden');
            fileList.classList.add('hidden');
            sendBotCommand('fm_list_files', { uri: parentUri });
        }
    });

    grantAccessButton.addEventListener('click', () => {
        sendBotCommand('fm_grant_access');
    });

    parseUrlData();
});
