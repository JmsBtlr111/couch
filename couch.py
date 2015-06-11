# coding=utf-8
from flask import Flask, render_template, url_for, redirect, flash, request
from flask_login import current_user, login_user, logout_user
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager, UserMixin
from rauth.service import OAuth2Service
import json

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
    social_id = db.Column(db.String(64), nullable=False, unique=True)
    nickname = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(64), nullable=True)


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
    print('authorize')
    if not current_user.is_anonymous():
        return redirect(url_for('index'))
    params = {'response_type' : 'code',
              'redirect_uri' : url_for('oauth_callback', _external=True)}
    return redirect(rdio_auth_service.get_authorize_url(**params))


@app.route('/oauth/callback', methods=['GET', 'POST'])
def oauth_callback():
    print('callback')
    # check to make sure the user authorized the request
    if not 'code' in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('index'))

    print(request.args)

    data = {'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': url_for('oauth_callback', _external=True)}

    session = rdio_auth_service.get_auth_session(data=data, decoder=json.loads)

    # the 'me' response
    me = session.get('me')

    print(me)

    # user = User.query.filter_by(social_id=social_id).first()
    # if not user:
    #     user = User(social_id=social_id, nickname=username, email=email)
    #     db.session.add(user)
    #     db.session.commit()
    # login_user(user, True)
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run()
