# coding=utf-8
"""Contains the configuration variables for the Couch app"""
import os

basedir = os.path.abspath(os.path.dirname(__file__))

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
SECRET_KEY = 'development'
DEBUG = True