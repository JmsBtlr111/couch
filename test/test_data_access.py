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
        model_dao.add_user_to_db(User(id="mock_id",
                                      first_name="Hugo",
                                      last_name="Batman",
                                      user_url="mock_url"))
        assert model_dao.get_user("mock_id") is not None
        assert model_dao.get_user("mock_id").first_name == "Hugo"
        assert model_dao.get_user("mock_id").last_name == "Batman"
        assert model_dao.get_user("mock_id").user_url == "mock_url"
        model_dao.destroy_db()

    def test_get_all_users(self):
        model_dao.add_user_to_db(User(id="mock_id_1",
                                      first_name="f_n_1",
                                      last_name="l_n_1",
                                      user_url="url_1"))
        model_dao.add_user_to_db(User(id="mock_id_2",
                                      first_name="f_n_2",
                                      last_name="l_n_2",
                                      user_url="url_2"))
        model_dao.add_user_to_db(User(id="mock_id_3",
                                      first_name="f_n_3",
                                      last_name="l_n_3",
                                      user_url="url_3"))
        users = model_dao.get_all_users()
        assert len(users) == 3
        assert users[0].id == "mock_id_1"
        assert users[1].id == "mock_id_2"
        assert users[2].id == "mock_id_3"
        model_dao.destroy_db()

    # Test that a group can be correctly added and retrieved
    def test_add_and_get_group(self):
        model_dao.add_group_to_db(Group(id=1, name="group_name"))
        assert model_dao.get_group(1) is not None
        model_dao.destroy_db()

    def test_get_all_groups(self):
        model_dao.add_group_to_db(Group(id=1, name="group_1"))
        model_dao.add_group_to_db(Group(id=2, name="group_2"))
        model_dao.add_group_to_db(Group(id=3, name="group_3"))
        groups = model_dao.get_all_groups()
        assert len(groups) == 3
        assert groups[0].name == "group_1"
        assert groups[1].name == "group_2"
        assert groups[2].name == "group_3"
        model_dao.destroy_db()

    def test_add_and_get_groups_users(self):
        model_dao.add_user_to_db(User(id="mock_id_1",
                                      first_name="f_n_1",
                                      last_name="l_n_1",
                                      user_url="url_1"))
        model_dao.add_user_to_db(User(id="mock_id_2",
                                      first_name="f_n_2",
                                      last_name="l_n_2",
                                      user_url="url_2"))
        model_dao.add_user_to_db(User(id="mock_id_3",
                                      first_name="f_n_3",
                                      last_name="l_n_3",
                                      user_url="url_3"))
        model_dao.add_group_to_db(Group(id=1, name="group_1"))
        group = model_dao.get_group(1)
        model_dao.add_user_to_group(model_dao.get_user("mock_id_1"), group)
        model_dao.add_user_to_group(model_dao.get_user("mock_id_2"), group)
        model_dao.add_user_to_group(model_dao.get_user("mock_id_3"), group)
        users = model_dao.get_group(1).users
        assert users[0].id == "mock_id_1"
        assert users[1].id == "mock_id_2"
        assert users[2].id == "mock_id_3"
        model_dao.destroy_db()

    def test_add_user_to_group_twice(self):
        model_dao.add_user_to_db(User(id="mock_id_1",
                                      first_name="f_n_1",
                                      last_name="l_n_1",
                                      user_url="url_1"))
        model_dao.add_group_to_db(Group(id=1, name="group_1"))
        user_added_to_group = model_dao.add_user_to_group(model_dao.get_user("mock_id_1"), model_dao.get_group(1))
        assert (user_added_to_group is not None)
        user_added_to_group = model_dao.add_user_to_group(model_dao.get_user("mock_id_1"), model_dao.get_group(1))
        assert (user_added_to_group is None)
        model_dao.destroy_db()

    def test_remove_user_from_group(self):
        model_dao.add_user_to_db(User(id="mock_id_1",
                                      first_name="f_n_1",
                                      last_name="l_n_1",
                                      user_url="url_1"))
        model_dao.add_group_to_db(Group(id=1, name="group_1"))
        model_dao.add_user_to_group(model_dao.get_user("mock_id_1"), model_dao.get_group(1))
        model_dao.remove_user_from_group(model_dao.get_user("mock_id_1"), model_dao.get_group(1))
        group = model_dao.get_group(1)
        assert not isinstance(group.users, list)
        model_dao.destroy_db()

    def test_remove_user_from_group_its_not_part_of(self):
        model_dao.add_group_to_db(Group(id=1, name="group_1"))
        test_user = User(id="mock_id_1",
                         first_name="f_n_1",
                         last_name="l_n_1",
                         user_url="url_1")
        return_value = model_dao.remove_user_from_group(test_user, model_dao.get_group(1))
        assert return_value is None
        model_dao.destroy_db()
