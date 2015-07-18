# __author__ = 'hugobateman'
#
# from flask.ext.socketio import join_room, leave_room, emit
# import redis
# from app import socketio
#
#
# # Called when initial web socket connection is created
# @socketio.on('connect', namespace='/group')
# def test_connect():
#     print "Connected yo"
#     emit('my response', {'data': 'Connected', 'count': 0})
#
# # Called when a user joins a room, which represents a specific group
# @socketio.on('join', namespace='/group')
# def on_join(data):
#     room = data['room']
#     join_room(room)
#
#
# # Called when a user leaves a room they are a part of
# @socketio.on('leave', namespace='/group')
# def on_leave(data):
#     room = data['room']
#     leave_room(room)
#
#
# # Called when a user adds a track to the playlist
# # TODO: Make sure this is how redis will handle playlist additions
# @socketio.on('add_to_playlist', namespace='/group')
# def add_to_playlist(data):
#     redis_connection = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)
#     redis_connection.rpush(data['group_id'], data['track'])
#     playlist = redis_connection.lrange(data['group_id'], 0, -1)
#     # TODO: Perform operations to update the playlist
#     emit('playlist_update', {'playlist': playlist}, namespace='/group', room=data['group_id'])
#
#
# @socketio.on('next_track_request', namespace='/group')
# def next_track_request(data):
#     redis_connection = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)
#     playlist = redis_connection.lrange(data['group_id'], 0, -1)
#     # TODO: Perform necessary checks to determine which track to send
#     emit('next_track', {'track': playlist[0]}, namespace='/group', room=False)