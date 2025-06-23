# OneHubDB Webapp Backend

This FastAPI backend receives .dump file uploads, saves them, and triggers the restore process using restore_demo.sh.

## Getting Started

1. Create a virtual environment and install dependencies:
   ```zsh
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Start the backend server:
   ```zsh
   uvicorn app:app --reload
   ```

The API will be available at http://localhost:8000
