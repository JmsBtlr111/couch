# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask_restful import Api
from flask.ext.sqlalchemy import SQLAlchemy
from dictalchemy import make_class_dictable

app = Flask(__name__, static_url_path='')
app.config.from_object('config')

db = SQLAlchemy(app)
make_class_dictable(db.Model)
api = Api(app)

from app.views import UserView, UserListView

api.add_resource(UserView, '/api/user/<string:user_id>')
api.add_resource(UserListView, '/api/user')