# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask_restful import Api
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.socketio import SocketIO
from dictalchemy import make_class_dictable
from gevent import monkey
import logging

logging.basicConfig()
monkey.patch_all()

app = Flask(__name__, static_url_path='')
app.config.from_object('config')

db = SQLAlchemy(app)
make_class_dictable(db.Model)
api = Api(app)
socketio = SocketIO(app)

from app.views import connect, join_group, leave_group, update_listeners
from app.views import UserView, UserListView, GroupView, GroupListView

api.add_resource(views.UserView, '/api/user/<string:user_id>')
api.add_resource(views.UserListView, '/api/user')
api.add_resource(views.GroupView, '/api/group/<int:group_id>')
api.add_resource(views.GroupListView, '/api/group')
