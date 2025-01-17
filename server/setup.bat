@echo off
REM Activate the virtual environment
call venv\Scripts\activate

REM Start the server
flask --app run.py run --debug --port=5001