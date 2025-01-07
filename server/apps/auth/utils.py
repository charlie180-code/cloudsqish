from flask import  make_response, render_template, current_app
from io import BytesIO
import qrcode
from datetime import datetime
from ..models.company import Company
from firebase_admin import storage, initialize_app, credentials
import base64
from itsdangerous import URLSafeTimedSerializer
from werkzeug.utils import secure_filename
import os
import requests
from sqlalchemy.orm import joinedload
from ..models.file import File
import string
import random


def create_qr_code(data):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill='black', back_color='white')

    qr_code_io = BytesIO()
    qr_img.save(qr_code_io, format='PNG')
    qr_code_io.seek(0)

    return qr_code_io

def generate_invoice_id():
    import random
    import datetime

    date_str = datetime.datetime.now().strftime("%Y%m%d")
    random_number = random.randint(1000, 9999)
    invoice_id = f"{date_str}-{random_number}"

    return invoice_id


def generate_reset_token(user, expiration=3600):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return s.dumps({'reset': user.id}, salt=current_app.config['SECURITY_PASSWORD_SALT'])

def confirm_reset_token(token, expiration=3600):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token, salt=current_app.config['SECURITY_PASSWORD_SALT'], max_age=expiration)
    except:
        return False
    return data['reset']


def save_file_locally(file, folder_name="static"):
    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.root_path, folder_name, filename)
    file.save(file_path)
    return filename


def check_internet_connection():
    url = "https://www.google.com"
    timeout = 8
    try:
        response = requests.get(url, timeout=timeout)
        return True if response.status_code == 200 else False
    except requests.ConnectionError:
        return False
    

def get_company_files(company_id, user_id):
    """
    Retrieve all files associated with a specific company and user.
    """
    # Query all files that are associated with the given company_id and user_id
    files = File.query.filter_by(company_id=company_id, user_id=user_id).all()
    
    return files



def save_files(files, folder):
    saved_files = []
    bucket = storage.bucket()

    for file in files:
        if file:
            filename = secure_filename(file.filename)
            blob = bucket.blob(f"{folder}/{filename}")
            blob.upload_from_file(file)
            blob.make_public()
            saved_files.append(blob.public_url)

    return saved_files

def generate_password():
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(characters) for _ in range(16))
    return password

def get_tasks_for_user(user_email):
    from ..models.task import Task
    from ..models.user import User

    user = User.query.filter_by(email=user_email).first()
    if user:
        tasks = Task.query.filter_by(assigned_to=user.id).all()
    else:
        tasks = []

    return tasks