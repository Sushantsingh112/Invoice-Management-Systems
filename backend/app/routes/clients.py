from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import Client
from app.middleware.auth import log_audit, paginate_query

clients_bp = Blueprint('clients', __name__)


@clients_bp.route('', methods=['GET'])
@jwt_required()
def get_clients():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '').strip()
    is_active = request.args.get('is_active', None)

    query = Client.query

    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(
                Client.client_name.ilike(like),
                Client.company_name.ilike(like),
                Client.email.ilike(like),
                Client.phone.ilike(like)
            )
        )

    if is_active is not None:
        query = query.filter(Client.is_active == (is_active.lower() == 'true'))

    query = query.order_by(Client.created_at.desc())
    result = paginate_query(query, page, per_page)

    return jsonify({
        "success": True,
        "data": [c.to_dict() for c in result['items']],
        "pagination": {
            "total": result['total'],
            "page": result['page'],
            "per_page": result['per_page'],
            "pages": result['pages'],
            "has_next": result['has_next'],
            "has_prev": result['has_prev'],
        }
    }), 200


@clients_bp.route('/<int:client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    client = Client.query.get_or_404(client_id)
    return jsonify({"success": True, "data": client.to_dict()}), 200


@clients_bp.route('', methods=['POST'])
@jwt_required()
def create_client():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('client_name'):
        return jsonify({"success": False, "message": "Client name is required"}), 400
    if not data.get('email'):
        return jsonify({"success": False, "message": "Email is required"}), 400

    client = Client(
        client_name=data['client_name'].strip(),
        company_name=data.get('company_name', '').strip() or None,
        email=data['email'].strip().lower(),
        phone=data.get('phone', '').strip() or None,
        address=data.get('address', '').strip() or None,
        city=data.get('city', '').strip() or None,
        state=data.get('state', '').strip() or None,
        country=data.get('country', '').strip() or None,
        postal_code=data.get('postal_code', '').strip() or None,
        tax_number=data.get('tax_number', '').strip() or None,
        gst_number=data.get('gst_number', '').strip() or None,
        additional_info=data.get('additional_info', '').strip() or None,
        is_active=data.get('is_active', True),
    )

    db.session.add(client)
    db.session.commit()

    from app.models.models import User
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'CREATE', 'client', client.id,
              new_value={'client_name': client.client_name, 'email': client.email})

    return jsonify({"success": True, "message": "Client created successfully", "data": client.to_dict()}), 201


@clients_bp.route('/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    user_id = get_jwt_identity()
    client = Client.query.get_or_404(client_id)
    old = client.to_dict()
    data = request.get_json()

    if data.get('client_name'):
        client.client_name = data['client_name'].strip()
    if data.get('email'):
        client.email = data['email'].strip().lower()

    fields = ['company_name', 'phone', 'address', 'city', 'state', 'country',
              'postal_code', 'tax_number', 'gst_number', 'additional_info']
    for f in fields:
        if f in data:
            setattr(client, f, data[f].strip() if data[f] else None)

    if 'is_active' in data:
        client.is_active = bool(data['is_active'])

    db.session.commit()
    from app.models.models import User
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'UPDATE', 'client', client.id, old_value=old, new_value=client.to_dict())
    return jsonify({"success": True, "message": "Client updated successfully", "data": client.to_dict()}), 200


@clients_bp.route('/<int:client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    user_id = get_jwt_identity()
    client = Client.query.get_or_404(client_id)

    # Check if client has invoices or quotations
    if client.invoices.count() > 0 or client.quotations.count() > 0:
        return jsonify({
            "success": False,
            "message": "Cannot delete client with existing invoices or quotations",
            "error": "CLIENT_HAS_RECORDS"
        }), 409

    old = client.to_dict()
    db.session.delete(client)
    db.session.commit()
    from app.models.models import User
    user = User.query.get(user_id)
    log_audit(user_id, user.email if user else '', 'DELETE', 'client', client_id, old_value=old)
    return jsonify({"success": True, "message": "Client deleted successfully"}), 200


@clients_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_clients():
    """Get all active clients for dropdowns (no pagination)."""
    clients = Client.query.filter_by(is_active=True).order_by(Client.client_name).all()
    return jsonify({"success": True, "data": [c.to_dict() for c in clients]}), 200
