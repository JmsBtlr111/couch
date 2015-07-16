# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import request, Response, json
from flask_restful import Resource, reqparse
from sqlite3 import IntegrityError
from sqlalchemy.orm.exc import UnmappedInstanceError
import redis

from app import app
from app.models import model_dao


parser = reqparse.RequestParser()


@app.route('/')
@app.route('/index')
@app.route('/login')
def login():
    """Displays the login page"""
    return app.send_static_file('index.html')


@app.route('/add_track', methods=['GET'])
def add_track():
    redis_connection = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)
    redis_connection.rpush(request.args['group_id'], request.args['track'])
    playlist = redis_connection.lrange(request.args['group_id'], 0, -1)
    response = Response(json.dumps({'playlist': playlist}), status=200,
                        mimetype='application/json')
    return response


class UserView(Resource):
    def get(self, user_id):
        user = model_dao.get_user(user_id)
        if user:
            return user.asdict(follow={'groups':{}})
        else:
            return {'error':'resource does not exist'}, 404


class UserListView(Resource):
    parser.add_argument('id', type=str, required=True, help='id must be specified')
    parser.add_argument('first_name', type=str, required=True, help='first name must be specified')
    parser.add_argument('last_name', type=str, required=True, help='last name must be specified')
    parser.add_argument('image_url', type=str, required=True, help='image URL must be specified')
    parser.add_argument('user_url', type=str, required=True, help='user URL must be specified')

    def get(self):
        users = model_dao.get_all_users()
        users_list = []
        if users:
            for user in users:
                users_list.append(user.asdict())
        users_dict = {'users':users_list}
        return users_dict

    def post(self):
        args = parser.parse_args()
        try:
            user = model_dao.create_model_from_args(args, 'user')
            return user.asdict(follow={'groups':{}})
        except IntegrityError:
            return {'error':'resource already exists'}, 409
        except UnmappedInstanceError:
            return {'error':'resource not created'}, 500