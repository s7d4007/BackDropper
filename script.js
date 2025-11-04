document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const dropZone = document.querySelector('.drop-zone');
    const fileUpload = document.getElementById('file-upload');
    
    // View containers
    const dropZoneWrapper = document.getElementById('drop-zone-wrapper');
    const resultWrapper = document.getElementById('result-wrapper');
    const loaderWrapper = document.getElementById('loader-wrapper'); // New
    
    // Result elements
    const previewImage = document.getElementById('preview-image');
    const downloadButton = document.getElementById('download-button');
    const startOverButton = document.getElementById('start-over-button');

    // --- Drag and Drop Handlers ---
    // Prevent browser default behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone on drag over
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

    // Handle file drop
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
        loaderWrapper.style.display = 'none'; // Also hide loader
        dropZoneWrapper.style.display = 'block';

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
        if (file) {
            uploadFile(file);
        }
    }

    /**
     * Upload file to backend and display result
     * @param {File} file - The file to process
     */
    function uploadFile(file) {
        console.log(`Processing file: ${file.name}`);

        // --- Set loading state ---
        dropZoneWrapper.style.display = 'none';
        resultWrapper.style.display = 'none';
        loaderWrapper.style.display = 'flex'; // Show loader
        
        let formData = new FormData();
        formData.append('file', file);

        // --- Send file to backend ---
        fetch('http://127.0.0.1:5000/remove-background', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                // Pass server error text to catch block
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

            // Create temporary URL from the returned blob
            const imageUrl = URL.createObjectURL(imageBlob);

            // Set image and download link
            previewImage.src = imageUrl;
            downloadButton.href = imageUrl;
            downloadButton.download = `no-bg-${file.name}`;
        })
        .catch(error => {
            console.error('Upload error:', error);
            alert(`Error processing file: ${error}`);
            
            // --- Error: Reset UI ---
            // Use startOverButton.click() to reset everything
            startOverButton.click(); 
        });
    }
});