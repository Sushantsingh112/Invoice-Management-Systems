import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL',
        'mysql+pymysql://root:password@localhost:3306/quotation_invoice_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'pool_size': 10,
        'max_overflow': 20,
    }

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

    # Mail
    MAIL_SERVER = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('SMTP_PORT', 587))
    MAIL_USE_TLS = os.environ.get('SMTP_ENCRYPTION', 'tls') == 'tls'
    MAIL_USE_SSL = os.environ.get('SMTP_ENCRYPTION', 'tls') == 'ssl'
    MAIL_USERNAME = os.environ.get('SMTP_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('SMTP_FROM_EMAIL', '')

    # File Upload
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'app/static/uploads')
    PDF_OUTPUT_FOLDER = os.environ.get('PDF_OUTPUT_FOLDER', 'app/static/pdfs')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 5242880))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
