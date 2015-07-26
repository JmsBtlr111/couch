# coding=utf-8
"""Contains the user model definition required by the Couch app"""
from app import db


class User(db.Model):
    """The Couch app user model"""
    id = db.Column(db.String(64), primary_key=True)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    image_url = db.Column(db.String(128), nullable=False)
    user_url = db.Column(db.String(64), nullable=False)

    def __repr__(self):
        return '<User (%s %s)>' % (self.first_name, self.last_name)