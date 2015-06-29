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

    def add_user_to_group(self, user, group):
        if not self.is_group_member(group, user):
            self.users.append(user)
            db.session.add(self)
            db.session.commit()

    def is_group_member(self, group, user):
        return self.users.filter(group_member_table.c.user_id == user.id) \
                   .filter(group.id == group_member_table.c.group_id).count() > 0

    def __repr__(self):
        return '<Group (%s)>' % self.name
