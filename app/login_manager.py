from app import lm
from app.models.user import User


@lm.user_loader
def load_user(user_id):
    """Load User specified by user_id.

    :param user_id: String

    Used by the flask_login LoginManager.
    """
    return User.query.get(unicode(user_id))