# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from rauth import OAuth2Service


app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)
lm = LoginManager(app)

lm.login_view = 'login'

rdio_auth_service = OAuth2Service(name='rdio',
                                  client_id=app.config['OAUTH_CREDENTIALS']['rdio']['id'],
                                  client_secret=app.config['OAUTH_CREDENTIALS']['rdio']['secret'],
                                  authorize_url='https://www.rdio.com/oauth2/authorize',
                                  access_token_url='https://services.rdio.com/oauth2/token',
                                  base_url='https://services.rdio.com/api/1/')

from app import views, models
