import requests
import sys
url = sys.argv[1]
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
}
r = requests.get(url,headers = headers)
r.raise_for_status()
r.encoding = r.apparent_encoding
print(r.text)