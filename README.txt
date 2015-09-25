Couch README
Overview
This README provides instructions on how to run the ‘Couch’ collaborative music streaming application as well as an
overview of the file structure.

Running Couch
In order to run couch, it’s dependencies must first be installed. To do this, pip must be installed on the user's
computer. Dependencies can then be installed by navigating to the couch directory via the command line and running the
command:

pip install -r requirements.txt

Once all the dependencies have been installed, the application can be run using the command:

python couch.py

This will start a couch server at localhost port 5000.

In order to log into Couch, the user must have an account with Rdio. A free account can be created, however this will
only allow the user to play a sample of 30 seconds for each song. This will not work with the current synchronisation
algorithm. Therefore, the user will need to log in using a paid account. For marking purposes, an account has been set
up with the following credentials:

Username: jmsbtlr111@gmail.com
Password: part4project

If you are unable to get Couch running locally, there is an up to date instance running on: couch-music.herokuapp.com.

File Structure
Couch’s top level directory contains several files along with three directories. The files are made up of the .db files
Couch uses for it’s databases, several files responsible for configuring parts of the application (such as the path to
the database amoung other things) as well as the couch.py file which is responsible for launching the application.

The ‘couch/app’ directory contains the majority of the business logic used in Couch. The ‘views.py’ file is responsible
for the applications routing and servicing queries to the REST API.

‘app/models’ contains files related to Couch’s persistent data. The model_dao.py file acts as a data abstraction layer
which provides a number of methods though which the different data models can be accessed. There are two key models
used: Users and Groups. These can also be found in the apps/models directory. In addition to this, a table with a
many-to-many relationship is defined in groups.py. This is where data relating the users the groups to which they
belong is stored.

The ‘app/static’ directory contains all files associated with Couch’s client-side application. The top level of this
directory contain the ‘app.js’ file. app.js is responsible for launching the AngularJS application which is loaded into
the client's browser once they visit the root url of the application. This is then used along with a number of
‘controllers’ that can be found in the group_view, home_view and login_view directories. In each of these directories
is an HTML file associated with each controller. Controllers can be dynamically injected into the module and are
attached to the DOM. They are used to define a particular set of behaviours.

The ‘app/bower_components’ directory contains all of the third party libraries used by the client-side application
such as angular, jquery, firebase etc.

The  ‘couch/test’ directory has been used for the files associated with the testing of Couch backend. The
‘test_data_access.py’ file contains all of the test which have been used for testing the integrity of the data access
method throughout development

The ‘couch/spec’ folder is where client-side tests have been done. The jasmine.yml file is used to configure the
Jasmine instance used for testing and a javascript file for each controller that has been tested
