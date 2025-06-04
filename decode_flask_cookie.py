import sys
from flask import Flask
from flask.sessions import SecureCookieSessionInterface

SECRET_KEY = 'c880e126ade54175970eb0df3664a03da2211c18892e9a1c7055be32333c6bd6'

class SimpleSecureCookieSessionInterface(SecureCookieSessionInterface):
    def get_signing_serializer(self, app):
        if not app.secret_key:
            return None
        signer_kwargs = dict(
            key_derivation=self.key_derivation,
            digest_method=self.digest_method
        )
        return self.serializer(app.secret_key, salt=self.salt, serializer=self.serializer, signer_kwargs=signer_kwargs)

def decode_flask_cookie(cookie_value, secret_key):
    app = Flask(__name__)
    app.secret_key = secret_key
    s = SimpleSecureCookieSessionInterface().get_signing_serializer(app)
    if not s:
        print('Failed to get serializer')
        return
    try:
        data = s.loads(cookie_value)
        print('Decoded session data:')
        print(data)
    except Exception as e:
        print(f'Error decoding cookie: {e}')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python decode_flask_cookie.py <cookie_value>')
        sys.exit(1)
    cookie_value = sys.argv[1]
    decode_flask_cookie(cookie_value, SECRET_KEY) 