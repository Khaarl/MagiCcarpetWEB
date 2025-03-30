import http.server
import socketserver
import os
import logging
import webbrowser
import time

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Setup logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('GameServer')

class GameServerHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler that properly serves JavaScript modules and addresses CORS issues"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        """Override to improve request logging"""
        logger.info(f"{self.address_string()} - {format%args}")
    
    def guess_type(self, path):
        """Ensure files are served with the correct MIME type"""
        base, ext = os.path.splitext(path)
        if ext == '.js':
            return 'application/javascript'
        elif ext == '.json':
            return 'application/json'
        elif ext == '.wasm':
            return 'application/wasm'
        elif ext == '.mp3':
            return 'audio/mpeg'
        elif ext == '.wav':
            return 'audio/wav'
        elif ext == '.ogg':
            return 'audio/ogg'
        elif ext == '.ico':
            return 'image/x-icon'
        return super().guess_type(path)
    
    def end_headers(self):
        """Add CORS headers to allow cross-origin requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests with improved error handling"""
        try:
            if self.path == '/favicon.ico':
                favicon_path = os.path.join(DIRECTORY, 'favicon.ico')
                if os.path.exists(favicon_path):
                    # If file exists, serve it normally
                    return super().do_GET()
                else:
                    # If no file exists, send 204
                    self.send_response(204)
                    self.end_headers()
                    return
            return super().do_GET()
        except Exception as e:
            logger.error(f"Error serving {self.path}: {str(e)}")
            self.send_error(500, f"Internal server error: {str(e)}")

def start_server():
    """Start the HTTP server and print status information"""
    # Allow socket reuse to avoid "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), GameServerHandler) as httpd:
        url = f"http://127.0.0.1:{PORT}"
        logger.info(f"Server started at {url}")
        logger.info(f"Serving files from: {DIRECTORY}")
        logger.info("To stop the server, press Ctrl+C")
        
        # Open browser automatically after a short delay
        time.sleep(0.5)
        try:
            webbrowser.open(url)
            logger.info(f"Opening {url} in default browser")
        except:
            logger.warning("Could not open browser automatically")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("\nServer stopped by user")

if __name__ == "__main__":
    print("Starting Magic Carpet Game Server...")
    start_server()
