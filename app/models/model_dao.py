"""Created 19/06/2015
This file provides access methods to couch's persistence data"""

from flask.ext.sqlalchemy import SQLAlchemy
from app import app, db
from user import User
from group import Group

# Access methods for User table


def create_db():
    db.create_all()


def destroy_db():
    db.session.remove()
    db.drop_all()


def get_user(id):
    user = User.query.filter_by(id=id).first()
    if not user:
        return None
    else:
        return user


def add_user(user):
    db.session.add(user)
    db.session.commit()


def get_user_first_name(id):
    user = User.query.filter_by(id=id).first()
    if not user:
        return None
    else:
        return user.first_name


def get_user_groups(self, id):
    user = User.query.filter_by(id=id).first()
    if not user:
        return None
    else:
        return user.groups


def add_user_group(self, user, group):
    user.add(group)


# Access methods for the groups table

def get_group(self, id):
    group = Group.query.filter_by(id=id).first()
    if not group:
        return None
    else:
        return group