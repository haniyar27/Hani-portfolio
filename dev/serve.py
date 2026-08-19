"""Local preview that behaves like GitHub Pages.

Serves the repo as plain static files on http://127.0.0.1:4173 — no
clean-URL rewriting, and a miss renders 404.html — so a link that breaks
in production breaks here too instead of being silently resolved.
"""
import functools, os
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class PagesHandler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
        if code != 404 or not os.path.exists(page):
            return super().send_error(code, message, explain)
        body = open(page, 'rb').read()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def end_headers(self):
        # never cache locally: a stale stylesheet or script silently hides
        # the change you are trying to look at
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, *a):
        pass

HTTPServer(('127.0.0.1', 4173), functools.partial(PagesHandler, directory=ROOT)).serve_forever()
