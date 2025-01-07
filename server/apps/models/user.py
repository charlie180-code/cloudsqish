from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from itsdangerous import Serializer
from flask_login import UserMixin
from .. import db, login_manager
import os
from .role import Role
from sqlalchemy.orm import aliased
from flask_login import current_user

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(64), unique=True, nullable=False)
    first_name = db.Column(db.String(64), default=" ")
    last_name = db.Column(db.String(128))
    password_hash = db.Column(db.String(128), nullable=False)
    date_of_birth = db.Column(db.DateTime(), default=datetime.utcnow)
    place_of_birth = db.Column(db.String(), default='Niamey')
    username = db.Column(db.String(64))
    name = db.Column(db.String(64))
    gender = db.Column(db.String())
    address = db.Column(db.String())
    profile_picture_url = db.Column(db.String)
    tools = db.Column(db.String())  # Tools the user is going to use
    preferred_music = db.Column(db.String())  # Preferred type of music
    preferred_movies = db.Column(db.String())  # Preferred movies
    preferred_books = db.Column(db.String())  # Preferred books
    member_since = db.Column(db.DateTime(), default=datetime.utcnow)
    contacts = db.relationship('Contact', back_populates='user', lazy='dynamic')

    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))


    files = db.relationship('File', backref='user', lazy=True)


    email_username = db.Column(db.String)
    email_password = db.Column(db.String)
    email_provider = db.Column(db.String)
    
    # Transport&logistics specific relationships
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    confirmed = db.Column(db.Boolean, default=False)
    authorizations = db.relationship('Authorization', backref='user', lazy='dynamic')
    purchases = db.relationship('Purchase', back_populates='user', lazy=True)
    tasks = db.relationship('Task', lazy=True)
    docs = db.relationship('Doc', backref='user', lazy=True)
    messages_sent = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy='dynamic')
    messages_received = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy='dynamic')


    # Transport & Logistics
    transport_license = db.Column(db.String)

    # Public Works
    project_role = db.Column(db.String)
    certification = db.Column(db.String)


    social_security_number = db.Column(db.String(64))
    bank_account_number = db.Column(db.String(64))
    bank_name = db.Column(db.String(128))
    routing_number = db.Column(db.String(64))
    emergency_contact_name = db.Column(db.String(128))
    emergency_contact_phone = db.Column(db.String(64))
    certifications = db.Column(db.Text)  # List of certifications
    training_records = db.Column(db.Text)  # Details of training received
    contract_start_date = db.Column(db.DateTime, default=datetime.utcnow)  # Contract start date
    contract_end_date = db.Column(db.DateTime, default=datetime.utcnow)  # Contract end date
    employment_terms = db.Column(db.Text)
    service_name = db.Column(db.String())
    registration_number = db.Column(db.String(), default='1254')

    # Electricity
    electrical_certification = db.Column(db.String)
    safety_training = db.Column(db.String)

    # Plumbing
    plumbing_certification = db.Column(db.String)
    tool_expertise = db.Column(db.String)

    # Electronics
    electronics_certification = db.Column(db.String)
    tech_skills = db.Column(db.String)

    # Biology
    lab_certifications = db.Column(db.String)
    research_interests = db.Column(db.String)

    blood_group = db.Column(db.String())


    folders = db.relationship('Folder', backref='owner', lazy=True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_confirmation_token(self, expiration=3600):
        s = Serializer(current_app.config['SECRET_KEY'], expiration)
        return s.dumps({'confirm': self.id}).decode('utf-8')
    


    def confirm(self, token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token.encode('utf-8'))
        except:
            return False

        if data.get('confirm') != self.id:
            return False

        self.confirmed = True
        db.session.add(self)
        return True
    
   

    def assign_role(self):
        roles = {
            current_app.config['SAILSMAKR_CEO']:'SAILSMARK_Ceo',
            current_app.config['SAILSMAKR_HR_MANAGER']:'Sailsmakr_HR_Manager',
            current_app.config['SAILSMAKR_ACCOUNTANT']:'Sailsmakr_Accountant',
        }
        agents_emails = os.getenv("SAILSMAKR_AGENTS_EMAILS")
        SAILSMAKR_AGENTS_EMAILS = agents_emails.split(',')

        if self.email in roles:
            role_name = roles[self.email]
            self.role = Role.query.filter_by(name=role_name).first()
        elif self.email in SAILSMAKR_AGENTS_EMAILS:
            self.role = Role.query.filter_by(name='Employee').first()
        else:
            self.role = Role.query.filter_by(default=True).first()

    @property
    def role_names(self):
        return [self.role.name] if self.role else []

    def has_role(self, role_name):
        return self.role and self.role.name == role_name

    def is_role(self, role_name):
        return self.has_role(role_name)
    
    def has_position(self, position_title):
        return self.role and self.role.position == position_title


    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        self.assign_role()

    def is_employee(self):
        return self.role.name == 'Employee'

    def is_hr_manager(self):
        return self.role.name == 'HR Manager'

    def is_accountant(self):
        return self.role.name == 'Accountant'

    def is_project_manager(self):
        return self.role.name == 'Project Manager'

    def is_ceo(self):
        return self.role.name == 'CEO'

    def is_user(self):
        return self.role.name == 'User'

    def is_reseller(self):
        return self.role.name == 'Reseller'
    
    # Position-based methods for company positions
    def is_responsible(self):
        return self.has_position('responsible')
    
    def is_company_it_administrator(self):
        return self.has_position('IT Administrator')

    def is_agent(self):
        return self.has_position('agent')

    def is_consultant(self):
        return self.has_position('consultant')
    
    def is_customer(self):
        return self.has_position('customer')
    
    def is_sales(self):
        return self.has_position('Sales Manager')

    def is_sailsmakr_sales_director(self):
        """Check if the current user is the Sailsmakr Sales Director."""
        sailsmakr_sales_director_email = current_app.config['SAILSMAKR_SALES_DIRECTOR']
        return current_user.email == sailsmakr_sales_director_email
    

    # School-specific roles
    def is_school_admin(self):
        return self.role.name == 'School Admin'

    def is_school_accountant(self):
        return self.role.name == 'School Accountant'

    def is_school_hr_manager(self):
        return self.role.name == 'School HR Manager'

    def is_librarian(self):
        return self.role.name == 'Librarian'

    def is_teacher(self):
        return self.role.name == 'Teacher'

    def is_parent(self):
        return self.role.name == 'Parent'

    def is_student(self):
        return self.role.name == 'Student'
    
    def is_it_administrator(self):
        return self.role.name == 'School IT Administrator'


    def is_sailsmakr_sales(email):
        sales_director = os.getenv('SAILSMAKR_SALES_DIRECTOR')

        if email == sales_director:
            return True
        return False




    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

