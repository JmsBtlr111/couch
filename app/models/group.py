# coding=utf-8
"""Contains the group model definition required by the Couch app"""
from app import db
from user import User


group_member_table = db.Table('users', db.metadata,
                              db.Column('group_id', db.Integer, db.ForeignKey('group.id')),
                              db.Column('user_id', db.String(64), db.ForeignKey('user.id')))


class Group(db.Model):
    """The Couch app group model"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    users = db.relationship('User', secondary=group_member_table, backref=db.backref('groups'), lazy='dynamic')

    def add_user(self, user):
        if user not in self.users:
            self.users.append(user)
            db.session.commit()

    def __repr__(self):
        return '<Group (%s)>' % self.name
