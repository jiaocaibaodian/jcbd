var $_GLOBAL = {
    data: null,
    layer: null,
    form: null,
    element: null
};
//一般直接写在一个js文件中
layui.use(['layer', 'form', 'element'], function() {
    $_GLOBAL.layer = layui.layer;
    form = layui.form;
    element = layui.element;
});
window.onload = function() {
    $(function() {
        $(".tips").hide()
        $(".layui-btn-primary").mouseover(function() {
            $_GLOBAL.layer.tips(this.dataset.text, this, {
                tips: [1, '#0FA6D8'], //设置tips方向和颜色 类型：Number/Array，默认：2 tips层的私有参数。支持上右下左四个方向，通过1-4进行方向设定。如tips: 3则表示在元素的下面出现。有时你还可能会定义一些颜色，可以设定tips: [1, '#c00']
                tipsMore: false, //是否允许多个tips 类型：Boolean，默认：false 允许多个意味着不会销毁之前的tips层。通过tipsMore: true开启
                time: 2000 //2秒后销毁，还有其他的基础参数可以设置。。。。这里就不添加了
            });
        })
    })
}

function grab() {
    $.ajax({
        method: "GET",
        url: "http://127.0.0.1/api?url=" + $("input[name='url']").val(),
        success: function(res) {
            $_GLOBAL.data = JSON.parse(res);
            console.log($_GLOBAL.data);
            $_GLOBAL.layer.msg("请求成功");
        },
        fail: function(err) {
            console.error(err);
            $_GLOBAL.layer.msg("请检查你输入的网址是否正确");
        }
    })
}

function fill() {
    $.ajax({
        method: 'GET',
        url: "http://127.0.0.1/api?url=" + $("input[name='url']").val(),
        success: function(res) {
            $_GLOBAL.data = JSON.parse(res);
            console.log($_GLOBAL.data[0]);
            // 填充表单
            $("input[name='tag']").val($_GLOBAL.data[0][0])
            $("input[name='class']").val($_GLOBAL.data[0][1])
            $("input[name='id']").val($_GLOBAL.data[0][2])
        },
        fail: function(err) {
            console.error(err);
            $_GLOBAL.layer.msg("请检查你输入的网址是否正确");
        }
    })
}

function display() {
    data = $_GLOBAL.data;
    //检查data是否为空
    if (!data) {
        //提示先输入正确的博客网址，然后点击请求按钮
        $_GLOBAL.layer.msg("请先输入正确的博客网址，然后点击请求按钮")
    }
    text = "<option value='-1'></option>";
    i = 0;
    data.forEach(element => {
        text += "<option value=\"" + i + "\">" + element[0] + " | " + element[1] + " | " + element[2] + "</option>"
        i++;
    });
    $_GLOBAL.layer.open({
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
            var data = $_GLOBAL.data;
            if (index2 != -1) {
                // 填充表单
                $("input[name='tag']").val(data[index2][0])
                $("input[name='class']").val(data[index2][1])
                $("input[name='id']").val(data[index2][2])
                $_GLOBAL.layer.close(index);
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