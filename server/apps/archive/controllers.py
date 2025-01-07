from flask import request, render_template, jsonify, redirect, url_for, flash, abort, make_response, current_app
from datetime import datetime
from flask_login import login_required, current_user
from ..models.folder import Folder
from ..models.file import File
from ..models.company import Company
from ..models.user import User
from ..models.role import Role
from .utils import save_files
from .. import db
from . import archive
from dotenv import load_dotenv
import os
from firebase_admin import storage
from ..models.user import User, generate_password_hash

load_dotenv()

@archive.route('/health')
def health_check():
    return jsonify(
        {'Message' :'Hello from CloudSquish Team, Server is good and you\'re ready to go'},
        200
    )

@archive.route('/get-my-client-folders/<int:user_id>', methods=['GET', 'POST'])
def handle_user_client_folders(user_id):
    user = User.query.get(user_id)
    
    if not user:
        if User.query.count() == 0:
            user = User(
                email="admin@example.com",
                first_name="Admin",
                last_name="User",
                password_hash=generate_password_hash("admin123", method='sha256'),
                username="admin",
                gender="Not specified",
                address="Headquarters",
                member_since=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.commit()
            user_id = user.id

    if request.method == 'GET':
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))

        folders = Folder.query.filter_by(user_id=user_id).paginate(page=page, per_page=limit, error_out=False)
        folder_data = [
            {
                "id": folder.id,
                "name": folder.name,
                "client": folder.client,
                "created_at": folder.created_at.strftime('%Y-%m-%d'),
                "unique_id": folder.unique_id,
                "number": folder.folder_number,
            }
            for folder in folders.items
        ]
        
        return jsonify({
            "folders": folder_data,
            "total": folders.total,
            "pages": folders.pages,
            "current_page": folders.page,
        })

    elif request.method == 'POST':
        data = request.json
        name = data.get('name', '').strip()
        client = data.get('client', '').strip()
        company_id = data.get('company_id', '')
        description = data.get('comments', '').strip()
        archive_date = data.get('date')

        if not name:
            return jsonify({"error": "Le nom du dossier est requis", "field": "folderName"}), 400

        if not client:
            return jsonify({"error": "Nom du client est requis", "field": "folderClient"}), 400

        try:
            if archive_date:
                archive_date = datetime.strptime(archive_date, '%Y-%m-%d')
            else:
                archive_date = datetime.utcnow()

            new_folder = Folder(
                name=name,
                client=client,
                user_id=user_id,
                company_id=company_id,
                description=description,
                created_at=archive_date
            )

            db.session.add(new_folder)
            db.session.commit()

            return jsonify({
                "message": "Folder created successfully",
                "folder": {
                    "id": new_folder.id,
                    "name": new_folder.name,
                    "client": new_folder.client,
                    "description": new_folder.description,
                    "created_at": new_folder.created_at.strftime('%Y-%m-%d')
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@archive.route('/get-folder-details/<int:folder_id>', methods=['GET'])
def get_folder_details(folder_id):
    try:
        folder = Folder.query.get(folder_id)
        if folder is None:
            return jsonify({"error": "Folder not found"}), 404
        
        files = File.query.filter_by(folder_id=folder.id).all()
        file_details = []
        
        for file in files:
            file_details.append({
                "name": file.label,
                "file_type": file.filepath.split('.')[-1] if file.filepath else "unknown",
                "url": file.filepath or None 
            })
        
        folder_details = {
            "id": folder.id,
            "name": folder.name,
            "client": folder.client,
            "description": folder.description,
            "created_at": folder.created_at.strftime('%Y-%m-%d'),
            "unique_id": folder.unique_id,
            "number": folder.folder_number,
            "files": file_details
        }

        return jsonify(folder_details)
    
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500



@archive.route('/edit-my-client-folder/<int:folder_id>', methods=['PUT'])
def edit_folder(folder_id):
    data = request.get_json()

    folder = Folder.query.get(folder_id)

    if folder is None:
        return jsonify({"error": "Folder not found"}), 404

    new_name = data.get('name')
    new_client = data.get('client')

    if not new_name:
        return jsonify({"error": "Folder name is required"}), 400

    folder.name = new_name
    folder.client = new_client

    try:
        db.session.commit()
        return jsonify({"message": "Folder updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error updating folder: {str(e)}"}), 500


@archive.route('/attach-my-client-files/<int:folder_id>', methods=['POST'])
def attach_my_client_files(folder_id):
    folder = Folder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    folder_path = os.path.join(os.environ.get('ARCHIVE_STATIC_DIR'), folder.name)
    os.makedirs(folder_path, exist_ok=True)

    try:
        files = request.files.getlist('files[]')
        labels = request.form.getlist('labels[]')

        if len(labels) == 0:
            return jsonify({"error": "At least one label is required."}), 400

        saved_entries = []

        for i, label in enumerate(labels):
            file = files[i] if i < len(files) else None

            if label and not file:
                new_entry = File(
                    label=label,
                    filepath=None,
                    folder_id=folder.id,
                    uploaded_at=datetime.utcnow(),
                    user_id=1,
                    company_id=1
                )
                db.session.add(new_entry)
                saved_entries.append({"label": label, "url": None})

            elif label and file:
                file_path = os.path.join(folder_path, file.filename)
                file.save(file_path)

                file_url = url_for('static', filename=os.path.join('uploads', folder.name, file.filename), _external=True)

                new_entry = File(
                    label=label,
                    filepath=file_url,
                    folder_id=folder.id,
                    uploaded_at=datetime.utcnow(),
                    user_id=1,
                    company_id=1
                )
                db.session.add(new_entry)
                saved_entries.append({"label": label, "url": file_url})

        db.session.commit()

        return jsonify({
            "message": "Labels and files successfully attached.",
            "saved_entries": saved_entries
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@archive.route('/delete-folder/<int:folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    folder = Folder.query.get(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    try:
        folder_path = os.path.join(os.environ.get('ARCHIVE_STATIC_DIR'), folder.name)
        if os.path.exists(folder_path):
            for root, dirs, files in os.walk(folder_path, topdown=False):
                for file in files:
                    os.remove(os.path.join(root, file))
                for dir in dirs:
                    os.rmdir(os.path.join(root, dir))
            os.rmdir(folder_path)

        File.query.filter_by(folder_id=folder.id).delete()

        db.session.delete(folder)
        db.session.commit()

        return jsonify({"message": "Folder and its contents have been deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred while deleting the folder: {str(e)}"}), 500
    

@archive.route('/get-files-by-user/<int:user_id>', methods=['GET'])
def get_files_by_user(user_id):
    files = File.query.filter_by(user_id=user_id).all()
    
    if not files:
        return jsonify([])

    files_data = []
    
    for file in files:
        folder = Folder.query.get(file.folder_id)
        

        file_data = {
            "id": file.id,
            "label": file.label,
            "filepath": file.filepath,
            "uploaded_at": file.uploaded_at,
            "folder_name": folder.name,
            "folder_id": folder.unique_id,
            "client_name": folder.client
        }
        files_data.append(file_data)

    return jsonify(files_data)

@archive.route('/delete-file/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    file = File.query.get(file_id)
    if not file:
        return jsonify({"error": "File not found"}), 404

    try:
        if file.filepath:
            file_path = os.path.join(os.environ.get('ARCHIVE_STATIC_DIR', ''), file.filepath)
            if os.path.exists(file_path):
                os.remove(file_path)

        db.session.delete(file)
        db.session.commit()

        return jsonify({"message": "fichier correctement supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@archive.route('/search-user-folders-or-files/<int:user_id>', methods=['GET'])
def search_user_folders_or_files(user_id):
    query = request.args.get('query', '').strip()

    folders = Folder.query.filter(
        (Folder.name.ilike(f'%{query}%')) | 
        (Folder.unique_id.ilike(f'%{query}%')),
        Folder.user_id == user_id
    ).all()

    results = []
    for folder in folders:
        files = File.query.filter(File.folder_id == folder.id).all()
        
        folder_data = {
            'id': folder.id,
            'name': folder.name,
            'unique_id': folder.unique_id,
            'client_name': folder.client,
            'files': [{
                'id': file.id,
                'label': file.label,
                'filepath': file.filepath,
                'uploaded_at': file.uploaded_at
            } for file in files]
        }
        results.append(folder_data)

    return jsonify(results)