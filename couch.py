# coding=utf-8
"""Run the Couch app"""
from app import app, socketio

if __name__ == "__main__":
    socketio.run(app)
