document.addEventListener('DOMContentLoaded', () => {
    // Select necessary HTML elements.
    const codeEditor = document.getElementById('code-editor');
    const filenameSelect = document.getElementById('filename-select');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const searchInput = document.getElementById('search-input');
    const installBtn = document.getElementById('install-btn');
    const onlineStatus = document.createElement('span');
    onlineStatus.id = 'online-status';
    onlineStatus.dataset.tooltip = '';
    document.getElementById('status-bar').appendChild(onlineStatus);

    // For saving the PWA install prompt event.
    let deferredPrompt;

    // --- Core Functionality ---

    // Function to download the file
    downloadBtn.addEventListener('click', () => {
        const filename = filenameSelect.value;
        const content = codeEditor.value;

        if (!filename) {
            alert('Please select a file name first.');
            return;
        }

        // Prepend a UTF-8 BOM (Byte Order Mark) to ensure the file is read correctly 
        // by text editors, especially when containing non-ASCII characters like Bangla.
        const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Function to reset the editor
    resetBtn.addEventListener('click', () => {
        codeEditor.value = '';
        searchInput.value = '';
        filenameSelect.selectedIndex = 0;
    });

    // Function to search within the code
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value;
        const content = codeEditor.value;

        if (!searchTerm) return;

        const startIndex = content.toLowerCase().indexOf(searchTerm.toLowerCase());

        if (startIndex !== -1) {
            const endIndex = startIndex + searchTerm.length;
            codeEditor.focus();
            codeEditor.setSelectionRange(startIndex, endIndex);
            // Scroll the found text into view
            const lineHeight = codeEditor.clientHeight / codeEditor.rows;
            const jump = (content.substr(0, startIndex).match(/\n/g) || []).length;
            codeEditor.scrollTop = jump * lineHeight;
        }
    });
    
    // --- PWA Functionality ---

    // Register the service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered, scope:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }

    // Handle the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the browser from automatically showing the install prompt
        e.preventDefault();
        // Save the event for later use.
        deferredPrompt = e;
        // Update the UI to give the user the option to install the app.
        installBtn.style.display = 'block';

        installBtn.addEventListener('click', () => {
            // Hide our A2HS button from the UI
            installBtn.style.display = 'none';
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user's decision
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        });
    });

    // --- Online/Offline Status ---
    // Function to update the network status
    function updateOnlineStatus() {
        if (navigator.onLine) {
            onlineStatus.className = 'online';
            onlineStatus.dataset.tooltip = 'Online';
        } else {
            onlineStatus.className = 'offline';
            onlineStatus.dataset.tooltip = 'Offline';
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check status for the first time
    updateOnlineStatus();

});