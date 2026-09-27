import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
migrate = Migrate()


def create_app(config_name=None):
    app = Flask(__name__, static_folder='static')

    # Load config
    from app.config import config
    env = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config.get(env, config['default']))

    # Ensure folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PDF_OUTPUT_FOLDER'], exist_ok=True)

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # CORS
    CORS(app, resources={r"/api/*": {
        "origins": [app.config['FRONTEND_URL'], "http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({"success": False, "message": "Token has expired", "error": "TOKEN_EXPIRED"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        from flask import jsonify
        return jsonify({"success": False, "message": "Invalid token", "error": "INVALID_TOKEN"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        from flask import jsonify
        return jsonify({"success": False, "message": "Authorization token required", "error": "MISSING_TOKEN"}), 401

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.clients import clients_bp
    from app.routes.quotations import quotations_bp
    from app.routes.invoices import invoices_bp
    from app.routes.payments import payments_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.settings import settings_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(quotations_bp, url_prefix='/api/quotations')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    # Health check
    @app.route('/api/health')
    def health():
        from flask import jsonify
        return jsonify({"status": "ok", "message": "Quotation & Invoice API is running"})

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        from flask import jsonify
        return jsonify({"success": False, "message": "Resource not found", "error": "NOT_FOUND"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        from flask import jsonify
        return jsonify({"success": False, "message": "Method not allowed", "error": "METHOD_NOT_ALLOWED"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        from flask import jsonify
        import logging
        logging.error(f"Internal server error: {str(e)}")
        return jsonify({"success": False, "message": "Internal server error", "error": "INTERNAL_ERROR"}), 500

    return app
