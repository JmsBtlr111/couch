# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import request, Response, json
import redis

from app import app


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