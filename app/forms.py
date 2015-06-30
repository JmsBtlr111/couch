from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired

class CreateNewGroupForm(Form):
    group_name = StringField('group_name', validators=[DataRequired()])