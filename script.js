document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const dropZone = document.querySelector('.drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const dropZoneLabel = document.getElementById('drop-zone-label'); // New
    const errorMessage = document.getElementById('error-message'); // New

    // View containers
    const dropZoneWrapper = document.getElementById('drop-zone-wrapper');
    const resultWrapper = document.getElementById('result-wrapper');
    const loaderWrapper = document.getElementById('loader-wrapper');

    // Result elements
    const previewImage = document.getElementById('preview-image');
    const downloadButton = document.getElementById('download-button');
    const startOverButton = document.getElementById('start-over-button');

    // --- NEW: Error Handling Functions ---
    function showError(message) {
        // Set the error text and make it visible
        errorMessage.textContent = message;
        dropZoneLabel.classList.add('has-error');

        // Reset the UI to the drop-zone state
        loaderWrapper.style.display = 'none';
        resultWrapper.style.display = 'none';
        dropZoneWrapper.style.display = 'block';
    }

    function hideError() {
        errorMessage.textContent = '';
        dropZoneLabel.classList.remove('has-error');
    }

    // --- Drag and Drop Handlers ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    // --- File Input (Click) Handler ---
    fileUpload.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // --- "Start Over" Button Handler ---
    startOverButton.addEventListener('click', () => {
        // Hide result, show drop zone
        resultWrapper.style.display = 'none';
        loaderWrapper.style.display = 'none';
        dropZoneWrapper.style.display = 'block';

        hideError(); // Clear any errors

        // Revoke the old blob URL to free up memory
        if (previewImage.src) {
            URL.revokeObjectURL(previewImage.src);
        }

        // Clear old image and download link
        previewImage.src = '';
        downloadButton.href = '';
    });


    // --- File Processing ---
    function handleFiles(files) {
        // Process only the first file
        const file = files[0];
        if (!file) {
            return;
        }

        // --- NEW: Frontend File Validation ---
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validImageTypes.includes(file.type)) {
            showError('Please upload a valid image (PNG, JPG, or WEBP).');
            return; // Stop the upload
        }
        // ------------------------------------

        hideError(); // Clear error from previous attempt
        uploadFile(file);
    }

    /**
     * Upload file to backend and display result
     * @param {File} file - The file to process
     */
    function uploadFile(file) {
        console.log(`Processing file: ${file.name}`);
        hideError(); // Clear any previous errors

        // --- Set loading state ---
        dropZoneWrapper.style.display = 'none';
        resultWrapper.style.display = 'none';
        loaderWrapper.style.display = 'flex';

        let formData = new FormData();
        formData.append('file', file);

        // --- Send file to backend ---
        fetch('http://127.0.0.1:5000/remove-background', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || 'Network response was not ok')
                    });
                }
                return response.blob();
            })
            .then(imageBlob => {
                // --- Success: Show result ---
                loaderWrapper.style.display = 'none';
                resultWrapper.style.display = 'flex';

                const imageUrl = URL.createObjectURL(imageBlob);

                previewImage.src = imageUrl;
                downloadButton.href = imageUrl;
                downloadButton.download = `no-bg-${file.name}`;
            })
            .catch(error => {
                console.error('Upload error:', error);
                // Friendly Error Messages
                let friendlyMessage = 'Error processing file. Please try again.';
                if (error.message && !error.message.includes('Network response') && !error.message.includes('Failed to fetch')) {
                    friendlyMessage = error.message;
                } else if (error.message.includes('Failed to fetch')) {
                    friendlyMessage = 'Looks like our server took a coffee 🍵 break without telling us.';
                }
                showError(friendlyMessage);
                // ----------------------------------------------
            });
    }
});

