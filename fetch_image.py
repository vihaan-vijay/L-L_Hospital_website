import urllib.request
import re
import json

url = 'https://html.duckduckgo.com/html/?q=L%26L+Hospital+Malumichampatti+Coimbatore'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    images = re.findall(r'src="(//external-content\.duckduckgo\.com[^\"]+)"', html)
    if images:
        print(images[0])
    else:
        print("No images found on DDG")
except Exception as e:
    print('Error:', e)
