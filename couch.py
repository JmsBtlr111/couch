from flask import Flask, render_template, request
import urllib2, urllib, rdio

app = Flask(__name__)


@app.route('/')
def hello_world():
    return render_template('login.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        payload = {'response' : 'code', 'client_id' : 'unittzyjrnc2beuytg2kq6n7mi', 'redirect_uri' : 'http://localhost:5000/success'}
        data = urllib.urlencode(payload)
        req = urllib2.Request('https://www.rdio.com/oauth2/authorize', data)
        response = urllib2.urlopen(req)
        the_page = response.read()
        print("boob")


@app.route('/success', methods=['GET', 'POST'])
def success():
    if request.method == 'POST':
        print(request.values[0])
        payload = {'grant_type' : 'authorization_code',
                   'code' : request.values[0],
                   'redirect_uri' : 'http://localhost:5000/success'}


if __name__ == '__main__':
    app.run()
