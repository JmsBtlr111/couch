__author__ = 'hugobateman'
import redis


class RedisPlaylist:

    def __init__(self):
        self.connection = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)

    def add_to_playlist(self, playlist_name, track_id):
        self.connection.lpush(playlist_name, track_id)

    def get_playlist(self, playlist_name):
        return self.connection.get("playlist_name")