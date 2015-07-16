"""Created 19/06/2015
This file provides access methods to couch's persistence data"""
from sqlite3 import IntegrityError

from app import db
from user import User
from group import Group

# Utility database methods
def create_db():
    db.create_all()


def destroy_db():
    db.session.remove()
    db.drop_all()


def create_model_from_args(args, model_type):
    if model_type == 'user':
        model = User(id=args['id'],
                     first_name=args['first_name'],
                     last_name=args['last_name'],
                     image_url=args['image_url'],
                     user_url=args['user_url'])
    elif model_type == 'group':
        model = Group(name=['name'])
    else:
        model = None
    add_model_to_db(model)
    return model


def add_model_to_db(model):
    db.session.add(model)
    db.session.commit()


# Access methods for User table
def get_user(id):
    user = User.query.filter_by(id=id).first()
    return user


def get_all_users():
    users = User.query.all()
    return users


# Access methods for the groups table
def create_group(name):
    new_group = Group(name)
    db.session.add(new_group)
    db.session.commit()
    return new_group


def add_group(group):
    if get_group(group.id) is None:
        db.session.add(group)
        db.session.commit()


def get_group(group_id):
    group = Group.query.filter_by(id=group_id).first()
    if not group:
        return None
    else:
        return group


def add_user_to_group(user, group):
    group.add_user(user)