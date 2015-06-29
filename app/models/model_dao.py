"""Created 19/06/2015
This file provides access methods to couch's persistence data"""

from flask.ext.sqlalchemy import SQLAlchemy
from app import app, db
from user import User
from group import Group, group_member_table

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


def get_groups_by_user_id(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return None
    else:
        return user.groups


# Access methods for the groups table

def add_group(group):
    db.session.add(group)
    db.session.commit()


def get_group(group_id):
    group = Group.query.filter_by(id=group_id).first()
    if not group:
        return None
    else:
        return group


def add_user_to_group(user, group):
    group.add_user_to_group(user, group)