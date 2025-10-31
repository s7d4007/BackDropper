document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const dropZone = document.querySelector('.drop-zone');
    const fileUpload = document.getElementById('file-upload');
    
    // Get our new containers
    const dropZoneWrapper = document.getElementById('drop-zone-wrapper');
    const resultWrapper = document.getElementById('result-wrapper');
    
    // Get our new result elements
    const previewImage = document.getElementById('preview-image');
    const downloadButton = document.getElementById('download-button');
    const startOverButton = document.getElementById('start-over-button');

    // --- Drag and Drop Event Handlers ---
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

    // --- File Input (Click to Upload) Event Handler ---
    fileUpload.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // --- "Start Over" Button Event Handler ---
    startOverButton.addEventListener('click', () => {
        // Hide result, show drop zone
        resultWrapper.style.display = 'none';
        dropZoneWrapper.style.display = 'block';

        // Optional: Revoke the old blob URL to free up memory
        if (previewImage.src) {
            URL.revokeObjectURL(previewImage.src);
        }
        
        // Clear old image and download link
        previewImage.src = '';
        downloadButton.href = '';
    });

    // --- File Processing Function ---
    function handleFiles(files) {
        // We'll just process the first file, even if multiple are dropped
        const file = files[0];
        if (file) {
            uploadFile(file);
        }
    }

    /**
     * Uploads the file to the Python backend and displays the result
     * @param {File} file - The individual file
     */
    function uploadFile(file) {
        console.log(`Processing file: ${file.name}`);

        // --- NEW: Add a loading state ---
        // You could add a dedicated loading spinner here

        dropZoneWrapper.style.display = 'none';
        resultWrapper.style.display = 'flex'; // Use 'flex' as set in CSS
        previewImage.src = ''; // Clear any old image
        
        let formData = new FormData();
        formData.append('file', file);

        fetch('http://127.0.0.1:5000/remove-background', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                // If server sends an error, show it
                return response.text().then(text => { 
                    throw new Error(text || 'Network response was not ok') 
                });
            }
            return response.blob();
        })
        .then(imageBlob => {
            // --- THIS IS THE KEY PART ---
            // 1. Create a temporary URL from the image blob
            const imageUrl = URL.createObjectURL(imageBlob);

            // 2. Set the image source to this new URL
            previewImage.src = imageUrl;

            // 3. Set the download button's link to this new URL
            downloadButton.href = imageUrl;

            // 4. (Optional) Set a dynamic download filename
            downloadButton.download = `no-bg-${file.name}`;
            // -----------------------------
        })
        .catch(error => {
            console.error('Upload error:', error);
            alert(`Error processing file: ${error}`);
            // If an error happens, go back to the start
            startOverButton.click(); 
        });
    }
});