//一般直接写在一个js文件中
var that = this;
layui.use(['layer', 'form', 'element'], function() {
    that.layer = layui.layer;
    form = layui.form;
    element = layui.element;
    form.on("select(group)", function(data) {
        console.log(that.groups)
        for (let i = 0; i < that.groups.length; i++) {
            if (that.groups[i].value == data.value) {
                that.group = {
                    id: that.groups[i].id,
                    value: that.groups[i].value
                }
                console.log(that.group);
                return;
            }
        }
    });
});
window.onload = function() {
    $(".tips").hide()
    $(".layui-btn-primary").mouseover(function() {
        that.layer.tips(that.dataset.text, that, {
            tips: [1, '#0FA6D8'], //设置tips方向和颜色 类型：Number/Array，默认：2 tips层的私有参数。支持上右下左四个方向，通过1-4进行方向设定。如tips: 3则表示在元素的下面出现。有时你还可能会定义一些颜色，可以设定tips: [1, '#c00']
            tipsMore: false, //是否允许多个tips 类型：Boolean，默认：false 允许多个意味着不会销毁之前的tips层。通过tipsMore: true开启
            time: 2000 //2秒后销毁，还有其他的基础参数可以设置。。。。这里就不添加了
        });
    })
    $.ajax({
        method: 'get',
        url: "/resource/get_group",
        success: function(res) {
            that.groups = res;
            console.log(that.groups)
                //将groups的数据插入到
            that.groups.forEach(element => {
                var option = document.createElement("option")
                $(option).val(element.value)
                $(option).html(element.value)
                $("#rgroup").append(option)
            });
            form.render("select")
        },
        fail: function(err) {
            console.error(err);
        }
    })
}

function grab() {
    $.ajax({
        method: "GET",
        url: "http://127.0.0.1/api?url=" + $("input[name='url']").val(),
        success: function(res) {
            that.data = JSON.parse(res);
            console.log(that.data);
            that.layer.msg("请求成功");
        },
        fail: function(err) {
            console.error(err);
            that.layer.msg("请检查你输入的网址是否正确");
        }
    })
}

function fill() {
    $.ajax({
        method: 'GET',
        url: "http://127.0.0.1/api?url=" + $("input[name='url']").val(),
        success: function(res) {
            that.data = JSON.parse(res);
            console.log(that.data[0]);
            // 填充表单
            $("input[name='tag']").val(that.data[0][0])
            $("input[name='class']").val(that.data[0][1])
            $("input[name='id']").val(that.data[0][2])
        },
        fail: function(err) {
            console.error(err);
            that.layer.msg("请检查你输入的网址是否正确");
        }
    })
}

function display() {
    data = that.data;
    //检查data是否为空
    if (!data) {
        //提示先输入正确的博客网址，然后点击请求按钮
        that.layer.msg("请先输入正确的博客网址，然后点击请求按钮")
    }
    text = "<option value='-1'></option>";
    i = 0;
    data.forEach(element => {
        text += "<option value=\"" + i + "\">" + element[0] + " | " + element[1] + " | " + element[2] + "</option>"
        i++;
    });
    that.layer.open({
        type: 1,
        title: "根据您输入的网址，系统找到以下可能是文章主体的标签，请您进一步筛选或直接填写正确的标签、类和Id",
        content: '<form action="" class="layui-form">\
                    <div class="layui-form-item">\
                        <label class="layui-form-label">筛选</label>\
                        <div class="layui-input-block">\
                            <select name="tags" lay-verify="required">' + text + '</select>\
                        </div>\
                    </div>\
                </form>',
        area: ["1000px", "300px"],
        scrollbar: false,
        success: function(layero, index) {
            // 重新渲染弹层中的下拉选择框select
            form.render('select');
        },
        btn: ['确认填充'],
        yes: function(index, layero) {
            // 确认填充
            var index2 = $("select").val();
            var data = that.data;
            if (index2 != -1) {
                // 填充表单
                $("input[name='tag']").val(data[index2][0])
                $("input[name='class']").val(data[index2][1])
                $("input[name='id']").val(data[index2][2])
                that.layer.close(index);
            }
        }
    })
}

function getHTML() {
    //填充markdown编辑器
    var body = JSON.stringify([$("input[name='tag']").val(),
        $("input[name='class']").val(),
        $("input[name='id']").val()
    ]);
    console.log(body)
    $.ajax({
        method: "post",
        url: "http://127.0.0.1/api",
        data: {
            url: $("input[name='url']").val(),
            body: body
        },
        success: function(res) {
            $("#test-editor textarea").val(res);
        },
        fail: function(err) {
            console.error(err);
        }
    })
}

function modifyImage(i) {
    add = null;
    if (i == 1) {
        //表示添加域名
        add = /https:\/\/[\w\.]+/.exec($("input[name='url']").val())[0];
    } else if (i == 2) {
        add = "https";
    }
    console.log(add);
    $.ajax({
        method: 'POST',
        url: "http://www.rcloudy.cn/zhiling",
        data: {
            text: $("#test-editor textarea").val(),
            add: add
        },
        success: function(res) {
            console.log(res)
            $("#test-editor textarea").val(res)
        },
        fail: function(err) {
            console.error(err)
        }
    })
}

function sharingpost() {
    //转载发布
    //首先验证代码是否为空，
    var tip = function(msg) {
        that.layer.msg(msg)
    }
    code = $("#test-editor textarea").val();
    if (code == "") {
        tip("您并没有写文章")
        return;
    }
    //其次验证作者是否为空，
    author = $("#author").val();
    if (author == "") {
        tip("当前是转载发布，必须填写作者名");
        return;
    }
    //其次验证关键词是否为空，
    keywords = $("#keywords").val();
    if (keywords == "") {
        tip("请输入关键词")
        return;
    }
    //再验证是否选择标签
    labels = $("#label").val()
    if (labels == "") {
        tip("请选择标签")
    }
    var fileData = new FormData(); // new formData对象
    fileData.append("labels", labels);
    fileData.append("rtype", "短篇博客");
    fileData.append("rgid", that.group.id)
    fileData.append("rgname", that.group.value);
    fileData.append("rauthor", author)
    fileData.append("rorigin", $("input[name='url']").val())
    fileData.append("keywords", keywords)
    fileData.append("content", $("#test-editor textarea").val())
    $.post({
        url: "/resource/upload",
        data: that.fileData,
        success: res => {
            console.log(res)
        }
    })
}

function originalpost() {
    //原创发布
    //首先验证代码是否为空

    //其次验证关键词是否为空

    //最后验证是否选择标签
}