# -*- coding: utf-8 -*-
import http.server
import webbrowser

# Start CGI web server
# http://dackdive.hateblo.jp/entry/2016/01/22/100000
http.server.test(HandlerClass=http.server.CGIHTTPRequestHandler)

# Open web browser (does not work)
webbrowser.open('http://localhost:8000/')

