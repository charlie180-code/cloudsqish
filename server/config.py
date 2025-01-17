import os
from dotenv import load_dotenv

load_dotenv()

def get_cloudsquish_path():
    """
    Generate a writable path for the database and static files based on the OS.
    The files will be stored in the 'Documents/cloudsquish' folder inside the user's home directory.
    """
    home_dir = os.path.expanduser("~")
    documents_dir = os.path.join(home_dir, "Documents", "cloudsquish")
    os.makedirs(documents_dir, exist_ok=True)
    return documents_dir


def get_database_path(database_name="app.db"):
    """
    Generate the path for the database file inside the 'Documents/cloudsquish' folder.
    """
    return os.path.join(get_cloudsquish_path(), database_name)



def create_license_and_readme():
    cloudsquish_path = get_cloudsquish_path()

    # Create LICENSE file
    license_text = """This software is a product of Sailsmakr. All rights reserved."""
    with open(os.path.join(cloudsquish_path, "LICENSE"), "w") as f:
        f.write(license_text)

    # Create README.md file
    readme_text = """# ClousdSquish Data Backup Guide

    To back up your data:
    1. Copy the entire 'cloudsquish' folder to an external storage device.
    2. To restore, copy the folder back to the 'Documents' directory on your new machine.
    3. Ensure the folder structure remains intact.

    For support, contact support@sailsmakr.com.
    """
    with open(os.path.join(cloudsquish_path, "README.md"), "w") as f:
        f.write(readme_text)



class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT')
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.googlemail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    SAILSMAKR_CEO = os.environ.get('SAILSMAKR_CEO')
    SAILSMAKR_HR_MANAGER = os.environ.get('SAILSMAKR_HR_MANAGER')
    SAILSMAKR_ACCOUNTANT = os.environ.get('SAILSMAKR_ACCOUNTANT')
    SAILSMAKR_SALES_DIRECTOR = os.environ.get('SAILSMAKR_SALES_DIRECTOR')
    SAILSMAKR_AGENTS_EMAILS = os.environ.get('SAILSMAKR_AGENTS_EMAILS')
    BABEL_DEFAULT_LOCALE = 'fr'
    BABEL_SUPPORTED_LOCALES = ['en', 'fr', 'de', 'zh', 'ru', 'tr']
    BABEL_TRANSLATION_DIRECTORIES = './translations'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ARCHIVE_STATIC_DIR = get_cloudsquish_path()

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{get_database_path('app.db')}"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{get_database_path('app.db')}"


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('PRODUCTION_DATABASE_URL')
    PLACEHOLDER_STATIC_URL = os.environ.get('PLACEHOLDER_PRODUCTION_STATIC_URL')
    LOGIN_URL = os.environ.get('PRODUCTION_LOGIN_URL')
    SERVER_URL = os.environ.get('PRODUCTION_SERVER_URL')


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}