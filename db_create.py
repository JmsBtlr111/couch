#! /usr/bin/env python
# coding=utf-8
"""Python script used to create a clean DB for the Couch app"""
from app import db
db.create_all()
