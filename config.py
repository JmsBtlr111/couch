# coding=utf-8
"""Contains the configuration variables for the Couch app"""
import os
basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')

SECRET_KEY = 'development'
DEBUG = True
OAUTH_CREDENTIALS = {
    'rdio': {
        'id': 't2fn5phncnb7bft3ols4gfowbe',
        'secret': 'PRCCwaEtP-uzz3iSTAxJ8Q'
    }
}
