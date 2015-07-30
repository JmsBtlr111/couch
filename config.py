# coding=utf-8
"""Contains the configuration variables for the Couch app"""
import os

SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

SECRET_KEY = 'development'
DEBUG = True