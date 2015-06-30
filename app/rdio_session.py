# coding=utf-8

from flask import url_for, flash
from flask_login import login_user
from rauth import OAuth2Service
from couch import app
from requests import post
from app.models.user import User
from app.models import model_dao
from rdioapi import Rdio


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

    def login_user(self, auth_code):
        # get the Oauth access token
        access_token_response = self._get_access_token_response('oauth_callback', auth_code)

        # check for errors
        if access_token_response.status_code != 200:
            flash(access_token_response.json())
            return url_for('login')

        # now that we have an authenticated access token, we can authenticate our session
        access_token = access_token_response.json()[u'access_token']
        self._authenticate_session(access_token)

        # get the current user
        user = self.get_current_user(access_token)

        # if the user is not already in the DB, add them
        if not User.query.filter_by(id=user.id).first():
            model_dao.add_user(user)

        # log the user in
        login_user(user, True)
        return url_for('home')

    def get_authorize_url(self, redirect_uri):
        params = {'response_type': 'code', 'redirect_uri': url_for(redirect_uri, _external=True)}
        return self.auth_service.get_authorize_url(**params)

    def _get_access_token_response(self, redirect_uri, auth_code):
        data = {'code': auth_code,
                'grant_type': 'authorization_code',
                'redirect_uri': url_for(redirect_uri, _external=True),
                'client_id': self.auth_service.client_id,
                'client_secret': self.auth_service.client_secret}

        access_token_response = post(self.auth_service.access_token_url, data=data)
        return access_token_response

    def _authenticate_session(self, access_token):
        self.session = self.auth_service.get_session(access_token)

    def get_current_user(self, access_token):
        response = self.session.post(self.auth_service.base_url,
                                     data={'access_token': access_token, 'method': 'currentUser'}).json()

        id = str(response[u'result'][u'key'])
        first_name = str(response[u'result'][u'firstName'])
        last_name = str(response[u'result'][u'lastName'])
        image_url = str(response[u'result'][u'dynamicIcon'])
        user_url = str(response[u'result'][u'url'])

        return User(id=id, first_name=first_name, last_name=last_name, image_url=image_url, user_url=user_url)

    def get_playback_token(self, domain_g):
        # Rdio.rdio-call
        #
        # rdio = Rdio(app.config['OAUTH_CREDENTIALS']['rdio']['id'], app.config['OAUTH_CREDENTIALS']['rdio']['secret'])
        # return rdio.getPlaybackToken(domain=domain_g)

        unauthenticated_session = self.auth_service.get_session()

        return unauthenticated_session.post(self.auth_service.base_url,
                                            data={'domain': domain_g, 'method': 'getPlaybackToken'})
