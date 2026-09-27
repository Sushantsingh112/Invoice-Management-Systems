from functools import wraps
from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify
from app.models.models import User, AuditLog
from app import db


def admin_required(fn):
    """Decorator to restrict endpoint to admin users only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({"success": False, "message": "Admin access required", "error": "FORBIDDEN"}), 403
        return fn(*args, **kwargs)
    return wrapper


def active_user_required(fn):
    """Decorator to ensure user is active."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({"success": False, "message": "Account is deactivated", "error": "INACTIVE_ACCOUNT"}), 403
        return fn(*args, **kwargs)
    return wrapper


def log_audit(user_id, user_email, action, entity_type, entity_id=None, old_value=None, new_value=None):
    """Create an audit log entry."""
    try:
        log = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500]
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        import logging
        logging.warning(f"Audit log failed: {str(e)}")


def paginate_query(query, page, per_page=15):
    """Helper to paginate a SQLAlchemy query."""
    per_page = min(int(per_page), 100)
    page = max(int(page), 1)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': pagination.items,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    }
