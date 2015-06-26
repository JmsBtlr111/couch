import os
from unittest import TestCase

from config import basedir
from app import app
from app.models import model_dao
from app.models.user import User


class test_data_access(TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'test.db')
        self.app = app.test_client()
        model_dao.create_db()

    def tearDown(self):
        model_dao.destroy_db()

    def test_add_user(self):
        model_dao.add_user(User(id="mock_id",
                                first_name="Hugo",
                                last_name="Batman",
                                image_url="mock_url",
                                user_url="mock_url"))
        assert model_dao.get_user("mock_id") is not None

    def test_get_user_first_name(self):
       model_dao.add_user(User(id="james'_id",
                                first_name="James",
                                last_name="Butler",
                                image_url="mock_url",
                                user_url="mock_url"))
       assert model_dao.get_user_first_name("james'_id")=="James"