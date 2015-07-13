# coding=utf-8
"""Contains all the logic and routing to handle the displaying of views for the Couch app"""
from flask import render_template, redirect, url_for, request, flash, session
from app.models.model_dao import create_group, get_group, add_user_to_group
from flask_login import logout_user, login_required, current_user

from app import app
from app.rdio_session import RdioSession
from app.forms import CreateNewGroupForm


@app.route('/')
@app.route('/index')
@app.route('/login')
def login():
    """Displays the login page"""
    #return render_template('login.html')
    return app.send_static_file('index.html')


@app.route('/logout')
@login_required
def logout():
    """Logs the user out"""
    logout_user()
    return redirect(url_for('login'))


@app.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    """Navigate user to home page"""
    # form to
    create_new_group_form = CreateNewGroupForm()
    if create_new_group_form.validate_on_submit():
        flash('group created with name "%s"' % create_new_group_form.group_name.data)
        new_group = create_group(create_new_group_form.group_name.data)
        return redirect(url_for('group', group_id=new_group.id))
    return render_template('home.html', create_new_group_form=create_new_group_form)


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
    print(rdio_session.get_playback_token(url_for('oauth_callback', _external=True)))
    return redirect(redirect_url)


@app.route('/group/<int:group_id>',  methods=['POST', 'GET'])
@login_required
def group(group_id):
    if request.method == 'POST':
        print(request.args)
    elif request.method == 'GET':
        print(request.args)
        # check group exists
        group = get_group(group_id)
        if group is None:
            # Need an error message here
            return render_template('home.html')

        # add user to group if not currently a member
        if group not in current_user.groups:
            add_user_to_group(current_user, group)

        rdio_session = RdioSession()
        rdio_session.authenticate_session(session['access_token'])

        response = rdio_session.get_playback_token('127.0.0.1')
        print(response)
        if not response[u'status'] == "ok":
            raise RuntimeError("Unable to acquire playback token for group " + group_id)

        return render_template('group.html', group=group, playback_token=response[u'result'], domain="127.0.0.1")