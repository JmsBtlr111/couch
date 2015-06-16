# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user
import requests

from app import app, db, lm, rdio_auth_service
from app.models import User


@lm.user_loader
def load_user(user_id):
    """Load User specified by user_id.

    :param user_id: String

    Used by the flask_login LoginManager.
    """
    return User.query.get(unicode(user_id))


@app.route('/')
@app.route('/index')
@app.route('/login')
def login():
    """Displays the login page"""
    return render_template('login.html')


@app.route('/logout')
def logout():
    """Logs the user out"""
    logout_user()
    return redirect(url_for('login'))

@app.route('/home')
def home():
    """Navigate user to home page"""
    return render_template('home.html')

@app.route('/oauth/authorize')
def oauth_authorize():
    """Initial step of the Oauth2 authorization process"""
    params = {'response_type': 'code',
              'redirect_uri': url_for('oauth_callback', _external=True)}
    return redirect(rdio_auth_service.get_authorize_url(**params))


@app.route('/oauth/callback', methods=['GET', 'POST'])
def oauth_callback():
    """Final step of the Oauth2 authorization process.

    If user authorizes us to use their Rdio account, add them to the User DB and log them in.
    """

    # check the authorization code is present to make sure the user authorized the request
    if 'code' not in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('login'))

    # get the Oauth access token
    data = {'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': url_for('oauth_callback', _external=True),
            'client_id': rdio_auth_service.client_id,
            'client_secret': rdio_auth_service.client_secret}
    access_token_response = requests.post(rdio_auth_service.access_token_url, data=data).json()
    access_token = access_token_response[u'access_token']

    # set up the authenticated session with rdio
    session = rdio_auth_service.get_session(access_token)

    # get the user response as json
    user_response = session.post(rdio_auth_service.base_url,
                                 data={'access_token': access_token, 'method': 'currentUser'}).json()
    id = str(user_response[u'result'][u'key'])
    first_name = str(user_response[u'result'][u'firstName'])
    last_name = str(user_response[u'result'][u'lastName'])
    image_url = str(user_response[u'result'][u'dynamicIcon'])
    user_url = str(user_response[u'result'][u'url'])

    # add the user to the database
    user = User.query.filter_by(id=id).first()
    if not user:
        user = User(id=id, first_name=first_name, last_name=last_name, image_url=image_url, user_url=user_url)
        db.session.add(user)
        db.session.commit()

    # log the user in
    login_user(user, True)
    return redirect(url_for('home'))
