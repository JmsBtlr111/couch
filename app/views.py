# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import render_template, redirect, url_for, request, flash
from app.models import model_dao
from flask_login import logout_user, login_required
from app import app, lm
from app.rdio_session import RdioSession


@lm.user_loader  # TODO: Figure out a more appropriate place for this
def load_user(user_id):
    """Load User specified by user_id.

    :param user_id: String

    Used by the flask_login LoginManager.
    """
    return model_dao.get_user(unicode(user_id))

@app.route('/')
@app.route('/index')
@app.route('/login')
def login():
    """Displays the login page"""
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    """Logs the user out"""
    logout_user()
    return redirect(url_for('login'))


@app.route('/home')
@login_required
def home():
    """Navigate user to home page"""
    return render_template('home.html')


@app.route('/oauth/authorize')
def oauth_authorize():
    """Initial step of the Oauth2 authorization process"""
    return redirect(RdioSession().get_authorize_url('oauth_callback'))


@app.route('/oauth/callback', methods=['GET', 'POST'])
def oauth_callback():
    """Final step of the Oauth2 authorization process.
    If user authorizes us to use their Rdio account, add them to the User DB and log them in."""

    # check the authorization code is present to make sure the user authorized the request
    if 'code' not in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('login'))

    # log the user in to Rdio and Couch
    rdio_session = RdioSession()
    redirect_url = rdio_session.login_user(request.args['code'])
    return redirect(redirect_url)
