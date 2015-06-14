# coding=utf-8
"""Contains all model definitions required by the Couch app"""
from app import db


class User(db.Model):
    """The Couch app user model"""
    __tablename__ = 'users'
    key = db.Column(db.String(64), primary_key=True)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    image_url = db.Column(db.String(128), nullable=True)
    user_url = db.Column(db.String(64), nullable=False)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return unicode(self.key)  # python 2
        except NameError:
            return str(self.key)  # python 3

    def __repr__(self):
        return '<User {0!r:s} {1!r:s}>'.format(self.first_name, self.last_name)
