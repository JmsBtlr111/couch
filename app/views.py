# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user
import requests

from app import app, db, lm
from app.models.user import User
from app.rdio_session import RdioSession


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
    requests.get('http://www.rdio.com/signout')
    logout_user()
    return redirect(url_for('login'))


@app.route('/oauth/authorize')
def oauth_authorize():
    """Initial step of the Oauth2 authorization process"""
    return redirect(RdioSession().get_authorize_url('oauth_callback'))


@app.route('/oauth/callback', methods=['GET', 'POST'])
def oauth_callback():
    """Final step of the Oauth2 authorization process.

    If user authorizes us to use their Rdio account, add them to the User DB and log them in.
    """

    # check the authorization code is present to make sure the user authorized the request
    if 'code' not in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('login'))

    rdio_session = RdioSession()

    # get the Oauth access token
    access_token = rdio_session.get_access_token('oauth_callback', request.args['code'])

    # set up the authenticated session with rdio
    rdio_session.authenticate_session(access_token)

    # get the current user
    user = rdio_session.get_current_user(access_token)

    # if the user is not already in the DB, add them
    if not User.query.filter_by(id=user.id).first():
        db.session.add(user)
        db.session.commit()

    # log the user in
    login_user(user, True)
    return redirect(url_for('login'))
