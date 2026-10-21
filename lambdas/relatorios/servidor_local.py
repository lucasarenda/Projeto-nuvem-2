"""
Servidor HTTP mínimo para rodar a Lambda de relatórios na sua máquina,
simulando o API Gateway (payload 2.0). Só para desenvolvimento.

    pip install -r requirements.txt
    set DB_HOST=localhost & set DB_USER=doaperto & set DB_PASSWORD=... & set DB_SSL=false
    python servidor_local.py          # http://localhost:3001/relatorios/resumo
"""

import http.server
import os
import urllib.parse

from lambda_function import lambda_handler

PORTA = int(os.environ.get("PORTA", "3001"))


class Handler(http.server.BaseHTTPRequestHandler):
    def _responder(self, metodo):
        url = urllib.parse.urlparse(self.path)
        partes = [p for p in url.path.split("/") if p]
        if not partes or partes[0] != "relatorios":
            self.send_error(404)
            return
        evento = {
            "requestContext": {"http": {"method": metodo}},
            "pathParameters": {"tipo": partes[1]} if len(partes) > 1 else None,
            "queryStringParameters": {k: v[0] for k, v in urllib.parse.parse_qs(url.query).items()} or None,
        }
        r = lambda_handler(evento, None)
        self.send_response(r["statusCode"])
        for k, v in r["headers"].items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(r["body"].encode())

    def do_GET(self):
        self._responder("GET")

    def do_OPTIONS(self):
        self._responder("OPTIONS")


if __name__ == "__main__":
    print(f"Relatórios em http://localhost:{PORTA}/relatorios")
    http.server.ThreadingHTTPServer(("0.0.0.0", PORTA), Handler).serve_forever()
