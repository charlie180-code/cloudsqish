from datetime import datetime
from .. import db

class Authorization(db.Model):
    __tablename__ = 'authorizations'
    id = db.Column(db.Integer, primary_key=True)
    client_first_name = db.Column(db.String, nullable=False)
    client_last_name = db.Column(db.String, nullable=False)
    client_phone_number = db.Column(db.String, nullable=False)
    client_email_address = db.Column(db.String, unique=True)
    client_id_card_url = db.Column(db.String)
    client_signature_url = db.Column(db.String, nullable=False)
    client_location = db.Column(db.String, nullable=False)
    agent_first_name = db.Column(db.String, nullable=False)
    agent_last_name = db.Column(db.String, nullable=False)
    agent_email_address = db.Column(db.String)
    shipping_company_title = db.Column(db.String, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    provider_email1 = db.Column(db.String)
    provider_email2 = db.Column(db.String)
    provider_email3 = db.Column(db.String)
    provider_email4 = db.Column(db.String)
    provider_name1 = db.Column(db.String)
    provider_name2 = db.Column(db.String)
    provider_name3 = db.Column(db.String)
    provider_name4 = db.Column(db.String)
    lading_bills_identifier = db.Column(db.String, nullable=False)
    service_fees = db.Column(db.Float, default=0.0)
    granted = db.Column(db.Boolean, default=False)
    
    # ForeignKey to link to User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    # ForeignKey to link to Company
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)

    def __init__(self, client_first_name, client_last_name, client_phone_number, client_email_address, client_id_card_url, client_signature_url, client_location, agent_first_name, agent_last_name, agent_email_address, shipping_company_title, provider_email1=None, provider_email2=None, provider_email3=None, provider_email4=None, provider_name1=None, provider_name2=None, provider_name3=None, provider_name4=None, lading_bills_identifier=None, service_fees=0.0, granted=False, user_id=None, company_id=None):
        self.client_first_name = client_first_name
        self.client_last_name = client_last_name
        self.client_phone_number = client_phone_number
        self.client_email_address = client_email_address
        self.client_id_card_url = client_id_card_url
        self.client_signature_url = client_signature_url
        self.client_location = client_location
        self.agent_first_name = agent_first_name
        self.agent_last_name = agent_last_name
        self.agent_email_address = agent_email_address
        self.shipping_company_title = shipping_company_title
        self.provider_email1 = provider_email1
        self.provider_email2 = provider_email2
        self.provider_email3 = provider_email3
        self.provider_email4 = provider_email4
        self.provider_name1 = provider_name1
        self.provider_name2 = provider_name2
        self.provider_name3 = provider_name3
        self.provider_name4 = provider_name4
        self.lading_bills_identifier = lading_bills_identifier
        self.service_fees = service_fees
        self.granted = granted
        self.user_id = user_id
        self.company_id = company_id
