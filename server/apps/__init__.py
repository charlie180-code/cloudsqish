from flask import Flask
from flask_mail import Mail
from flask_moment import Moment
from flask_sqlalchemy import SQLAlchemy
from config import config
from flask_bootstrap import Bootstrap
from flask_login import LoginManager
from flask_oauthlib.client import OAuth
from flask_restcountries import CountriesAPI
from flask_migrate import Migrate
from flask_babel import Babel
from datetime import datetime
from flask_oauthlib.client import OAuth
from flask_cors import CORS

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
bootstrap = Bootstrap()
mail = Mail()
db = SQLAlchemy()
moment = Moment()
oauth = OAuth()
rapi = CountriesAPI()
migrate = Migrate()
babel = Babel()


def create_app(development=True, template_folder='templates', static_folder='static'):
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
    app.config.from_object(config['development'])
    config['development'].init_app(app)
    app.config['JSON_AS_ASCII'] = False
    bootstrap.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    moment.init_app(app)
    login_manager.init_app(app)
    oauth.init_app(app)
    rapi.init_app(app)

    from .archive import archive as archive_blueprint
    app.register_blueprint(archive_blueprint, url_prefix='/archive/v1')

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    

    with app.app_context():
        from .models.role import Role
        db.create_all()
        Role.insert_roles()

    CORS(app)

    return app