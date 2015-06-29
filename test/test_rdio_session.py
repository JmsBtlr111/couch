from unittest import TestCase
from mock import patch
from app import app
from app.rdio_session import RdioSession
from flask import url_for
from urllib import quote

class test_rdio_session(TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['OAUTH_CREDENTIALS'] = {'rdio':
                                               {'id': 'test_id',
                                                'secret': 'test_secret'}
                                           }
        self.app = app.test_client()
        self.ctx = app.test_request_context('/?next=http://test.com/')
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_get_authorize_url(self):
        rdio_session = RdioSession()
        rdio_session.auth_service.authorize_url = "http://www.test.com"
        redirect_uri = 'login'
        expected_url = 'http://www.test.com?redirect_uri=' + quote(url_for(redirect_uri, _external=True), '') + '&response_type=code&client_id=test_id'
        assert rdio_session.get_authorize_url('login') == expected_url

