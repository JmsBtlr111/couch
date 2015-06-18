# coding=utf-8

from flask import url_for
from rauth import OAuth2Service
from couch import app
from requests import post
from app.models.user import User


class RdioSession:
    """This class is the Couch apps interface to the Rdio Api"""
    def __init__(self):
        name = 'rdio'
        client_id = app.config['OAUTH_CREDENTIALS']['rdio']['id']
        client_secret = app.config['OAUTH_CREDENTIALS']['rdio']['secret']
        authorize_url = 'https://www.rdio.com/oauth2/authorize'
        access_token_url = 'https://services.rdio.com/oauth2/token'
        base_url = 'https://services.rdio.com/api/1/'

        self.auth_service = OAuth2Service(name=name,
                                          client_id=client_id,
                                          client_secret=client_secret,
                                          authorize_url=authorize_url,
                                          access_token_url=access_token_url,
                                          base_url=base_url)

    def get_authorize_url(self, redirect_uri):
        params = {'response_type': 'code', 'redirect_uri': url_for(redirect_uri, _external=True)}
        return self.auth_service.get_authorize_url(**params)

    def get_access_token(self, redirect_uri, auth_code):
        data = {'code': auth_code,
                'grant_type': 'authorization_code',
                'redirect_uri': url_for(redirect_uri, _external=True),
                'client_id': self.auth_service.client_id,
                'client_secret': self.auth_service.client_secret}

        access_token_response = post(self.auth_service.access_token_url, data=data).json()
        return access_token_response[u'access_token']

    def authenticate_session(self, access_token):
        self.session = self.auth_service.get_session(access_token)

    def get_current_user(self, access_token):
        response = self.session.post(self.auth_service.base_url,
                                     data={'access_token': access_token, 'method': 'currentUser'}).json()

        id = str(response[u'result'][u'key'])
        first_name = str(response[u'result'][u'firstName'])
        last_name = str(response[u'result'][u'lastName'])
        image_url = str(response[u'result'][u'dynamicIcon'])
        user_url = str(response[u'result'][u'url'])

        return(User(id=id, first_name=first_name, last_name=last_name, image_url=image_url, user_url=user_url))
