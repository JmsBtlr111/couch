# coding=utf-8
"""Contains all the model definitions required by the Couch app"""
from app import db


association_table = db.Table('users', db.metadata,
                             db.Column('group_id', db.Integer, db.ForeignKey('group.id')),
                             db.Column('user_id', db.String(64), db.ForeignKey('user.id')))


class Group(db.Model):
    """The Couch app group model"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    users = db.relationship('User', secondary=association_table, backref=db.backref('groups'))

    def __repr__(self):
        return '<Group (%s)>' % (self.name)


class User(db.Model):
    """The Couch app user model"""
    id = db.Column(db.String(64), primary_key=True)
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
            return unicode(self.id)  # python 2
        except NameError:
            return str(self.id)  # python 3

    def __repr__(self):
        return '<User (%s %s)>' % (self.first_name, self.last_name)
