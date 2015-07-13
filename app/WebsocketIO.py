__author__ = 'hugobateman'

from flask.ext.socketio import join_room, leave_room, SocketIO, send

from app import app

websocket_io = SocketIO(app)


@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)


@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)

if __name__ == '__main__':
    websocket_io.run(app)