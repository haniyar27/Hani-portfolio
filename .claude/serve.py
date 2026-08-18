import functools, os
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class CleanURLHandler(SimpleHTTPRequestHandler):
    """Mimics Netlify: /experience serves experience.html."""
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        local = os.path.join(ROOT, p.lstrip('/'))
        if p not in ('', '/') and not os.path.exists(local) and os.path.exists(local + '.html'):
            local += '.html'
        if p in ('', '/'):
            local = os.path.join(ROOT, 'index.html')
        return local
    def log_message(self, *a): pass

HTTPServer(('127.0.0.1', 4173), functools.partial(CleanURLHandler, directory=ROOT)).serve_forever()
