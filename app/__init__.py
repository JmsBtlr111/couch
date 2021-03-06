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

from app.views import UserView, UserListView, GroupView, GroupListView

api.add_resource(views.UserView, '/api/user/<string:user_id>')
api.add_resource(views.UserListView, '/api/user')
api.add_resource(views.GroupView, '/api/group/<int:group_id>')
api.add_resource(views.GroupListView, '/api/group')

db.create_all()
