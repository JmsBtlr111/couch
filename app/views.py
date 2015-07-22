# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask_restful import Resource, reqparse
import redis
from couch import socketio
from flask.ext.socketio import join_room, leave_room, emit, disconnect

from app import app
from models import model_dao

# Create connection to the redis database
pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
socket_namespace = '/sockets'


@app.route('/')
@app.route('/index')
@app.route('/login')
def login():
    """Displays the login page"""
    return app.send_static_file('index.html')


# Called when initial web socket connection is created
@socketio.on('connect', namespace=socket_namespace)
def connect(message=None):
    if message:
        return
    print "connection"
    emit('confirm_connect', {'data': 'Connected', 'count': 0})


# Called when initial web socket connection is created when user joins a group
# TODO: Need to account for duplicate user names
@socketio.on('join_group', namespace=socket_namespace)
def join_group(message):
    user = model_dao.get_user(str(message['user_id'])).first_name
    group = str(message['group_id'])
    r = redis.Redis(connection_pool=pool)  # Connect to redis server
    join_room(group)  # Get the user to join the socket.io room corresponding to the group they've just joined
    current_listeners = r.lrange(group + "_listeners", 0, -1)
    if user not in current_listeners:
        r.rpush(group + "_listeners", user)  # Add user to redis object representing groups current listeners
        current_listeners = r.lrange(group + "_listeners", 0, -1)  # Get current listeners
    current_playlist = r.lrange(group + "_playlist", 0, -1)  # Get current playlist
    emit('update_current_listeners', {'listeners': current_listeners},
         room=group)  # Emit web-socket message updating groups current listeners to all current listeners
    emit('update_current_playlist', {'playlist': current_playlist})  # Send playlist to new group member


# Called when user leaves a group page causing the web-socket to disconnect
# TODO: Need to account for duplicate user names
@socketio.on('leave_group', namespace=socket_namespace)
def leave_group(message):
    user = model_dao.get_user(str(message['user_id'])).first_name
    group = str(message['group_id'])
    r = redis.Redis(connection_pool=pool)
    leave_room(group)
    r.lrem(group + "_listeners", user)
    current_listeners = r.lrange(group + "_listeners", 0, -1)
    emit('update_current_listeners', {'listeners': current_listeners}, room=group)

@socketio.on('update_listeners', namespace=socket_namespace)
def update_listeners(message):
    # TODO: Send a new playlist to the guy who has reconnected
    user = model_dao.get_user(str(message['user_id'])).first_name
    group = str(message['group_id'])
    r = redis.Redis(connection_pool=pool)
    join_room(group)
    current_listeners = r.lrange(group + "_listeners", 0, -1)
    if user not in current_listeners:
        r.rpush(group + "_listeners", user)
        current_listeners = r.lrange(group + "_listeners", 0, -1)
    emit('update_current_listeners', {'listeners': current_listeners}, room=group)


@socketio.on('add_to_playlist', namespace=socket_namespace)
def add_to_playlist(message):
    track = str(message['track_id'])
    group = str(message['group_id'])
    r = redis.Redis(connection_pool=pool)
    join_room(group)
    r.rpush(group + "_playlist", track)
    emit('track_added_to_playlist', message, room=group)


class UserView(Resource):
    def get(self, user_id):
        user = model_dao.get_user(user_id)
        if user:
            return user.asdict(follow={'groups': {}})
        else:
            return {'error': 'user does not exist'}, 404


class UserListView(Resource):
    def __init__(self):
        self.parser = reqparse.RequestParser(bundle_errors=True)
        self.parser.add_argument('id', type=str, required=True, help='id must be specified')
        self.parser.add_argument('first_name', type=str, required=True, help='first name must be specified')
        self.parser.add_argument('last_name', type=str, required=True, help='last name must be specified')
        self.parser.add_argument('image_url', type=str, required=True, help='image URL must be specified')
        self.parser.add_argument('user_url', type=str, required=True, help='user URL must be specified')

    def get(self):
        users = model_dao.get_all_users()
        users_list = []
        if users:
            for user in users:
                users_list.append(user.asdict())
        users_dict = {'users': users_list}
        return users_dict

    def post(self):
        args = self.parser.parse_args()
        user = model_dao.create_model_from_args(args, 'user')
        user_added_to_db = model_dao.add_user_to_db(user)
        if user_added_to_db:
            return user_added_to_db.asdict(follow={'groups': {}})
        else:
            return {'error': 'user already exists'}, 409


class GroupView(Resource):
    def __init__(self):
        self.parser = reqparse.RequestParser(bundle_errors=True)
        self.parser.add_argument('id', type=str, required=True, help='id must be specified')
        self.parser.add_argument('first_name', type=str, required=True, help='first name must be specified')
        self.parser.add_argument('last_name', type=str, required=True, help='last name must be specified')
        self.parser.add_argument('image_url', type=str, required=True, help='image URL must be specified')
        self.parser.add_argument('user_url', type=str, required=True, help='user URL must be specified')

    def get(self, group_id):
        group = model_dao.get_group(group_id)
        if group:
            return group.asdict(follow={'users': {}})
        else:
            return {'error': 'group does not exist'}, 404

    def post(self, group_id):
        group = model_dao.get_group(group_id)
        if group:
            args = self.parser.parse_args()
            user = model_dao.get_user(args['id'])
            user_added_to_group = model_dao.add_user_to_group(user, group)
            if user_added_to_group:
                return group.asdict(follow={'users': {}})
            else:
                return {'error': 'user already in group'}, 409
        else:
            return {'error': 'group does not exist'}, 404


class GroupListView(Resource):
    def __init__(self):
        self.parser = reqparse.RequestParser(bundle_errors=True)
        self.parser.add_argument('name', type=str, required=True, help='name must be specified')

    def get(self):
        groups = model_dao.get_all_groups()
        groups_list = []
        if groups:
            for group in groups:
                groups_list.append(group.asdict())
        groups_dict = {'groups': groups_list}
        return groups_dict

    def post(self):
        args = self.parser.parse_args()
        group = model_dao.create_model_from_args(args, 'group')
        group_added_to_db = model_dao.add_group_to_db(group)
        if group_added_to_db:
            return group_added_to_db.asdict(follow={'users': {}})
        else:
            return {'error': 'group already exists'}, 409