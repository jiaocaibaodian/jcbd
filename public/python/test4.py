# coding：utf-8
from lxml import etree
import requests
import re
from flask import Flask, request, json
import csv
import hashlib
from bs4 import BeautifulSoup
from flask_cors import CORS


def getHTML(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36 Edg/85.0.564.44"
    }
    r = requests.get(url, headers=headers)
    return etree.HTML(r.text)


def func(url):
    root = getHTML(url)
    divs = root.xpath("//div")
    articles = root.xpath("//article")
    data = []
    for ele in articles + divs:
        class_text = ele.get("class") if ele.get("class") != None else ""
        id_text = ele.get("id") if ele.get("id") != None else ""
        class_id = str.lower(class_text + id_text)
        tuples = []
        tag = ele.tag
        tuples.append(tag)
        # 检查class_id中是否包含blog,...
        if tag == 'article' or re.search(r'blog|body|content|container|article|post', class_id):
            tuples.append(class_text)
            tuples.append(id_text)
        else:
            continue
        if tuples not in data:
            data.append(tuples)
    if len(data) == 0:
        for ele in articles:
            data.append([ele.tag, ele.get("class") if ele.get("class") != None else "",
                         ele.get("id") if ele.get("id") != None else ""])
    return data, divs + articles


def md5(url):
    strs = re.findall(r'https?://[\w.]+', url)[0]
    hl = hashlib.md5()
    hl.update(strs.encode(encoding='utf-8'))
    uid = [hl.hexdigest()]
    return uid, strs


def process_text(url, ele):
    return etree.tounicode(ele)


def save_to_csv(data, path):
    # 先读取database.csv，判断当前uid是否已经存在
    with open(path, "r+") as f:
        csv_read = csv.reader(f)
        for line in csv_read:
            if line and line[0] == data[0]:
                if path=="database.csv":
                    return
                elif path=="dataset.csv":
                    if line[1]==data[1] and line[2]==data[2]:
                        return
        f.close()
    with open(path, 'a+') as f:
        csv_write = csv.writer(f)
        data_row = data
        csv_write.writerow(data_row)
        f.close()


app = Flask(__name__)
CORS(app, resources=r'/*')


@app.route('/', methods=['GET'])
def hello():
    return "欢迎使用API"


@app.route('/index', methods=['GET'])
def index():
    return app.send_static_file("index.html")

@app.route('/zhiling',methods=['POST'])
def zhiling():
    text = request.values.get("text")
    add = request.values.get("add")
    ele = etree.HTML(text)
    for el in ele.xpath("//img"):
        if el.get("src") and add not in el.get("src"):
            el.attrib['src'] = add+el.get("src")
    return etree.tounicode(ele)

@app.route('/api', methods=['GET', 'POST'])
def api():
    global data
    data = []
    if request.method == 'GET':
        url = request.args.get("url")
        # 首先检查该url是否存在于database中，如果存在，直接返回database中的值
        uid, _ = md5(url)
        with open("database.csv", "r") as f:
            csv_read = csv.reader(f)
            for line in csv_read:
                if line and line[0] == uid[0]:
                    data = [line[1:]]
                    return json.dumps(data)
            f.close()
        # 没找到该url,从网络获取
        data, _ = func(url)
        return json.dumps(data)
    elif request.method == 'POST':
        # 获取传递参数
        url = request.values.get("url")
        body = request.values.get('body')
        train_data, elements = func(url)
        body = eval(body)
        print(body)
        for i in elements:
            class_ = i.get("class") if i.get("class") is not None else ""
            id_ = i.get("id") if i.get("id") is not None else ""
            uid, strs = md5(url)
            print(i.tag,body[0])
            print(class_,body[1])
            print(id_,body[2])
            if i.tag == body[0] and class_ == body[1] and id_ == body[2]:
                data = process_text(strs, i)
                # 保存获取方式至文件
                save_to_csv(uid + body[0:3], path="database.csv")
                # 保存数据至数据集
                save_to_csv(uid + body + [1], path="dataset.csv")
                soup = BeautifulSoup(data, "html.parser")
                return data
            else:
                save_to_csv(uid + [i.tag, class_, id_, 0], path="dataset.csv")

if __name__ == '__main__':
    app.run(host='127.0.0.1',
            port=8000,
            debug=True
            )
