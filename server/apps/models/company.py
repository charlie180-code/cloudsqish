from .. import db

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False, unique=False)
    description = db.Column(db.Text)
    logo_url = db.Column(db.String, nullable=False)
    location = db.Column(db.String, nullable=False)
    category = db.Column(db.String, nullable=False)
    nature = db.Column(db.String)
    email = db.Column(db.String, nullable=False, unique=True)
    phone_number = db.Column(db.String)
    website_url = db.Column(db.String)
    linkedin_url = db.Column(db.String)
    twitter_url = db.Column(db.String)
    facebook_url = db.Column(db.String)
    number_of_employees = db.Column(db.String)
    year_established = db.Column(db.Integer)
    annual_revenue = db.Column(db.String)
    currency = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=True)
    registration_date = db.Column(db.DateTime, default=db.func.current_timestamp())
    tags = db.Column(db.String)
    
    activity_sector = db.Column(db.String)  # Sector in which the company operates
    disk_space = db.Column(db.String)  # Total disk space allocated to the company
    number_of_emails = db.Column(db.Integer)  # Number of email accounts
    number_of_domain_names = db.Column(db.Integer)  # Number of domain names
    plan_end_date = db.Column(db.DateTime)  # End date of the company's current plan
    tools_used = db.Column(db.Text)  # List of tools or software used by the company

    
    # user specific
    users = db.relationship('User', backref='company', lazy=True)

    folders = db.relationship('Folder', backref='company', lazy=True)
    invoices = db.relationship('Invoice', backref='company', lazy=True)

    files = db.relationship('File', backref='company', lazy=True)    
    
    def __init__(self, title, logo_url, location, category, nature, email, description=None, phone_number=None, website_url=None, linkedin_url=None, twitter_url=None, facebook_url=None, number_of_employees=None, year_established=None, annual_revenue=None, is_active=True, registration_date=None, tags=None):
        self.title = title
        self.description = description
        self.logo_url = logo_url
        self.location = location
        self.category = category
        self.nature = nature
        self.email = email
        self.phone_number = phone_number
        self.website_url = website_url
        self.linkedin_url = linkedin_url
        self.twitter_url = twitter_url
        self.facebook_url = facebook_url
        self.number_of_employees = number_of_employees
        self.year_established = year_established
        self.annual_revenue = annual_revenue
        self.is_active = is_active
        self.registration_date = registration_date or db.func.current_timestamp()
        self.tags = tags