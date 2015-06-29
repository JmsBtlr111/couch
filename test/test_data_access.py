import os
from unittest import TestCase
from config import basedir
from app import app
from app.models import model_dao
from app.models.user import User
from app.models.group import Group

"""Test case for testing the data access object used for accessing persistence data
 pertaining to Users and their Groups"""

class test_data_access(TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'test.db')
        self.app = app.test_client()
        model_dao.create_db()

    def tearDown(self):
        model_dao.destroy_db()

    # Test adding a user to the database is done correctly
    def test_add_and_get_user(self):
        model_dao.add_user(User(id="mock_id",
                                first_name="Hugo",
                                last_name="Batman",
                                image_url="mock_url",
                                user_url="mock_url"))
        assert model_dao.get_user("mock_id") is not None

    # Test the DAO's get_user_first_name can correctly retrieve a user's first name
    def test_get_user_first_name(self):
        model_dao.add_user(User(id="james'_id",
                                first_name="James",
                                last_name="Butler",
                                image_url="mock_url",
                                user_url="mock_url"))
        assert model_dao.get_user_first_name("james'_id") == "James"

    # Test that users can add groups and vice-versa
    def test_get_users_groups(self):
        user = User(id="mock_id",
                    first_name="Hugo",
                    last_name="Batman",
                    image_url="mock_url",
                    user_url="mock_url")
        group = Group(id=1, name="group_name")
        model_dao.add_user(user)
        model_dao.add_group(group)
        model_dao.add_user_to_group(user, group)
        groups = model_dao.get_groups_by_user_id("mock_id")
        assert groups[0].name == "group_name"

    # Test that a group can be correctly added and retrieved
    def test_add_and_get_group(self):
        model_dao.add_group(Group(id=1, name="group_name"))
        assert model_dao.get_group(1) is not None