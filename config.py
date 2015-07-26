# coding=utf-8
"""Contains the configuration variables for the Couch app"""
import os
basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_URI = 'postgresql://jamesbutler@localhost/couchdb'

SECRET_KEY = 'development'
DEBUG = True