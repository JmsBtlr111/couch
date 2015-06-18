# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask_login import LoginManager

app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)
lm = LoginManager(app)

lm.login_view = 'login'

from app import views
from app.models import user, group
