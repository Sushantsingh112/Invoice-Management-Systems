from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timezone
from app import db
from app.models.models import User
from app.middleware.auth import log_audit

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body required"}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid email or password", "error": "INVALID_CREDENTIALS"}), 401

    if not user.is_active:
        return jsonify({"success": False, "message": "Account is deactivated", "error": "INACTIVE_ACCOUNT"}), 403

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    log_audit(user.id, user.email, 'LOGIN', 'user', user.id)

    return jsonify({
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "user": user.to_dict()
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    return jsonify({"success": True, "data": user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user:
        log_audit(user.id, user.email, 'LOGOUT', 'user', user.id)
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    current = User.query.get(user_id)
    if not current or current.role != 'admin':
        return jsonify({"success": False, "message": "Admin access required"}), 403
    users = User.query.all()
    return jsonify({"success": True, "data": [u.to_dict() for u in users]}), 200


@auth_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    user_id = get_jwt_identity()
    current = User.query.get(user_id)
    if not current or current.role != 'admin':
        return jsonify({"success": False, "message": "Admin access required"}), 403

    data = request.get_json()
    required = ['username', 'email', 'password', 'full_name']
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"success": False, "message": "Email already exists", "error": "EMAIL_EXISTS"}), 409

    user = User(
        username=data['username'],
        email=data['email'].lower(),
        full_name=data['full_name'],
        role=data.get('role', 'staff'),
        is_active=data.get('is_active', True)
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    log_audit(current.id, current.email, 'CREATE_USER', 'user', user.id, new_value={'username': user.username})
    return jsonify({"success": True, "message": "User created successfully", "data": user.to_dict()}), 201


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not user.check_password(data.get('current_password', '')):
        return jsonify({"success": False, "message": "Current password is incorrect"}), 400

    new_password = data.get('new_password', '')
    if len(new_password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"success": True, "message": "Password changed successfully"}), 200
