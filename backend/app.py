from flask import Flask, request, send_file
from flask_cors import CORS  # Import the CORS library
from rembg import remove
from PIL import Image
import io

# Initialize the Flask app
app = Flask(__name__)

CORS(app) #Allows Cross-Origin-Resource-Sharing (CORS)

#For Testing
@app.route('/')
def home():
    return "Hello, the backend server is running!"

# ---IMAGE PROCESSING ENDPOINT ---
@app.route('/remove-background', methods=['POST'])
def remove_background_route():

    # 1. Check if a file was sent in the request
    if 'file' not in request.files:
        # Send an error message if no file is found
        return "No file part", 400

    file = request.files['file']

    # 2. Check if the file is empty
    if file.filename == '':
        return "No selected file", 400

    if file:
        try:
            # 3. Read the image file from the request
            # We read it into 'bytes' so PIL can open it
            input_bytes = file.read()
            input_image = Image.open(io.BytesIO(input_bytes))

            # 4. Process the image using rembg
            output_image = remove(input_image)

            # 5. Save the processed image to an in-memory buffer
            # We use io.BytesIO to hold the image data in memory
            # instead of saving it to a file on the server.
            img_io = io.BytesIO()
            output_image.save(img_io, 'PNG')
            img_io.seek(0) # Rewind the buffer to the beginning

            # 6. Send the processed image back to the frontend
            return send_file(
                img_io,
                mimetype='image/png',
                as_attachment=False, # Send it as a file to be displayed
                download_name='no-bg.png'
            )

        except Exception as e:
            # Print the error to the console for debugging
            print(f"Error processing image: {e}")
            return "Error processing image", 500
# -------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5000)