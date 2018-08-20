# -*- coding: utf-8 -*-
import http.server
import webbrowser

# Open web browser
webbrowser.open('http://localhost:8000/')

# Start CGI web server
# http://dackdive.hateblo.jp/entry/2016/01/22/100000
http.server.test(HandlerClass=http.server.CGIHTTPRequestHandler)
