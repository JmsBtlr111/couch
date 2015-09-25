"""Created 19/06/2015
This file provides access methods to couch's persistence data"""

from app import db
from user import User
from group import Group
from group import group_member_table

# Utility database methods
def create_db():
    db.create_all()

# Method for destroying the current database
def destroy_db():
    db.session.remove()
    db.drop_all()

# Method for creating a model from a set of arguments
def create_model_from_args(args, model_type):
    model = None
    if model_type == 'user':
        model = User(id=args['id'],
                     first_name=args['first_name'],
                     last_name=args['last_name'],
                     user_url=args['user_url'])
    elif model_type == 'group':
        model = Group(name=args['name'])
    return model


# Method for adding a model to the database
def _add_model_to_db(model):
    db.session.add(model)
    db.session.commit()
    return model


# Access methods for User table
def get_user(id):
    user = User.query.filter_by(id=id).first()
    return user


# Method for getting all users from the database
def get_all_users():
    users = User.query.all()
    return users


# Method for adding a user to the database
def add_user_to_db(user):
    if get_user(user.id):
        return None
    else:
        return _add_model_to_db(user)


# Access methods for the groups table
def get_group(group_id):
    group = Group.query.filter_by(id=group_id).first()
    return group


# Method for getting all groups from the database
def get_all_groups():
    groups = Group.query.all()
    return groups


# Method for adding a group to the database
def add_group_to_db(group):
    if get_group(group.id):
        return None
    else:
        return _add_model_to_db(group)


# method for adding a user to a group
def add_user_to_group(user, group):
    if user not in group.users:
        group.users.append(user)
        db.session.commit()
        return user
    else:
        return None


# Method for removing a user from a group
def remove_user_from_group(user, group):
    if user in group.users:
        group.users.remove(user)
        db.session.commit()
        return user
    else:
        return None