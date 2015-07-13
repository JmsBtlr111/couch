# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask.ext.restless.manager import APIManager
from flask.ext.sqlalchemy import SQLAlchemy
from flask_login import LoginManager

app = Flask(__name__, static_url_path='')
app.config.from_object('config')

db = SQLAlchemy(app)
lm = LoginManager(app)

lm.login_view = 'login'

from app.models.user import User
from app.models.group import Group

api_manager = APIManager(app, flask_sqlalchemy_db=db)
api_manager.create_api(User, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(Group, methods=['GET', 'POST', 'DELETE', 'PUT'])

from app import views, login_manager
from app.models import model_dao
