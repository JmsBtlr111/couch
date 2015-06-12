# coding=utf-8
from flask import Flask, render_template, url_for, redirect, flash, request
from flask_login import current_user, login_user, logout_user
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager, UserMixin
from rauth.service import OAuth2Service
import requests

# Flask config
SECRET_KEY = 'development'
DEBUG = True
OAUTH_CREDENTIALS = {
    'rdio': {
        'id': 't2fn5phncnb7bft3ols4gfowbe',
        'secret': 'PRCCwaEtP-uzz3iSTAxJ8Q'
    }
}

app = Flask(__name__)
app.config.from_object(__name__)

rdio_auth_service = OAuth2Service(
            name='rdio',
            client_id = app.config['OAUTH_CREDENTIALS']['rdio']['id'],
            client_secret = app.config['OAUTH_CREDENTIALS']['rdio']['secret'],
            authorize_url = 'https://www.rdio.com/oauth2/authorize',
            access_token_url = 'https://services.rdio.com/oauth2/token',
            base_url = 'https://services.rdio.com/api/1/')

db = SQLAlchemy(app)
login_manager = LoginManager(app)


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    image_url = db.Column(db.String(64), nullable=True)
    user_url = db.Column(db.String(64), nullable=False)


@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)


@app.route('/')
def index():
    return render_template('login.html')


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))


@app.route('/oauth/authorize')
def oauth_authorize():
    if not current_user.is_anonymous():
        return redirect(url_for('index'))
    params = {'response_type' : 'code',
              'redirect_uri' : url_for('oauth_callback', _external=True)}
    return redirect(rdio_auth_service.get_authorize_url(**params))


@app.route('/oauth/callback', methods=['GET', 'POST'])
def oauth_callback():
    # check to make sure the user authorized the request
    if not 'code' in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('index'))

    # get the Oauth access token
    data = {'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': url_for('oauth_callback', _external=True),
            'client_id' : rdio_auth_service.client_id,
            'client_secret' : rdio_auth_service.client_secret}
    access_token_response = requests.post(rdio_auth_service.access_token_url, data=data).json()
    print(access_token_response)
    access_token = access_token_response[u'access_token']
    print(access_token)

    # set up the authenticated session with rdio
    session = rdio_auth_service.get_session(access_token)

    # get the user response
    user_response = session.post(rdio_auth_service.base_url, data={'access_token' : access_token, 'method' : 'currentUser'}).json()
    print(user_response)
    id = user_response[u'result'][u'key']
    first_name = user_response[u'result'][u'firstName']
    last_name = user_response[u'result'][u'lastName']
    image_url = user_response[u'result'][u'dynamicIcon']
    user_url = user_response[u'result'][u'url']

    # add the user to the database
    user = User.query.filter_by(id=id).first()
    if not user:
        user = User(id=id, first_name=first_name, last_name=last_name, image_url=image_url, user_url=user_url)
        db.session.add(user)
        db.session.commit()
    login_user(user, True)
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run()
