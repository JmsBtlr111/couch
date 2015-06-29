from app import lm
from app.models import model_dao

@lm.user_loader
def load_user(user_id):
    """Load User specified by user_id.

    :param user_id: String

    Used by the flask_login LoginManager.
    """
    return model_dao.get_user(unicode(user_id))