# coding=utf-8
"""Run the Couch app"""
from app import app
from flask.ext.socketio import SocketIO
from gevent import monkey

monkey.patch_all()
socketio = SocketIO(app)
thread = None

if __name__ == "__main__":
    socketio.run(app)
