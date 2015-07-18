# coding=utf-8
"""Initialise the Couch app"""
from flask import Flask
from flask_restful import Api
from flask.ext.sqlalchemy import SQLAlchemy
from dictalchemy import make_class_dictable
# from flask.ext.socketio import SocketIO
from gevent import monkey
import logging
#
logging.basicConfig()
monkey.patch_all()

app = Flask(__name__, static_url_path='')
app.config.from_object('config')

# socketio = SocketIO(app)
# thread = None
# socketio.run(app, host='127.0.0.1', port=5001)

db = SQLAlchemy(app)
make_class_dictable(db.Model)
api = Api(app)

from app.views import UserView, UserListView, GroupView, GroupListView

api.add_resource(UserView, '/api/user/<string:user_id>')
api.add_resource(UserListView, '/api/user')
api.add_resource(GroupView, '/api/group/<int:group_id>')
api.add_resource(GroupListView, '/api/group')