var app = new Vue({
    el: "#app",
    data() {
        return {
            login: {
                uname: "",
                uemail: "",
                upsw: "",
                rmpsw: 0,
                checkcode: ""
            },
            register: {
                uname: "",
                uemail: "",
                upsw: "",
                checkpsw: "",
                dialogVisible: false,
                mailCode: ""
            },
        }
    },
    methods: {
        get_login() {
            var flag = this.code_check()
            if (!flag) {
                alert("输入有误，请重新输入");
                return;
            }
            var loginData = {};
            if (app._data.login.uname == "") { //邮箱登录
                loginData = {
                    uemail: app._data.login.uemail,
                    upsw: app._data.login.upsw,
                }
            } else {
                loginData = { //用户名登录
                    uname: app._data.login.uname,
                    upsw: app._data.login.upsw
                }
            }
            axios({
                    method: 'post',
                    url: "/index/get_login",
                    data: loginData
                })
                .then(res => {
                    console.log(res.data);
                    alert(res.data.msg);
                    //跳转到首页
                    window.location.href = "index.html";
                })
                .catch(err => {
                    console.log(err);
                })
        },
        code_check() {
            return axios({
                    method: 'post',
                    url: "/index/code_check",
                    data: {
                        checkcode: app._data.login.checkcode
                    }
                })
                .then(res => {
                    console.log(res.data);
                    if (res.data.code == 1) {
                        $(".code_check_tip").css("display", "none");
                    } else {
                        $(".code_check_tip").css("display", "inline");
                    }
                    return res.data.code == 1;
                })
        },
        email_check() {
            //检测邮箱合法性
            var regExp = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
            if (!regExp.test(app._data.register.uemail)) {
                $(".email_check_tip").css("display", "inline");
                return false;
            } else {
                $(".email_check_tip").css("display", "none");
                return true;
            }
        },
        psw_check() {
            //检测密码合法性，必须且只能包含字母和数字和下划线，
            var psw = app._data.register.upsw;
            var flag = (/^\d+$/.test(psw)) || (/^[a-zA-Z]+$/.test(psw));
            if (flag) {
                $(".psw_check_tip").text("密码中至少包含字母和数字")
                $(".psw_check_tip").css("display", "inline");
                return false;
            }
            flag = /^\w+$/.test(psw);
            if (!flag) {
                $(".psw_check_tip").text("密码中只能包含字母，数字，下划线")
                $(".psw_check_tip").css("display", "inline");
                return false;
            }
            $(".psw_check_tip").css("display", "none");
            //检测两次密码一致性
            var checkpsw = app._data.register.checkpsw;
            if (checkpsw != psw) {
                $(".checkpsw_check_tip").text("两次密码不一致")
                $(".checkpsw_check_tip").css("display", "inline");
                return false;
            }
            $(".checkpsw_check_tip").css("display", "none");
            return true;
        },
        uname_check() {
            //检测用户名是否被占用
            return axios({
                    method: 'post',
                    url: "/index/uname_check",
                    data: {
                        uname: app._data.register.uname
                    }
                })
                .then((res) => {
                    console.log(res.data);
                    if (res.data) {
                        $(".name_check_tip").css("display", "none");
                    } else {
                        $(".name_check_tip").css("display", "inline");
                    }
                    return res.data;
                })
        },
        get_register() {
            //app._data.register.dialogVisible = false;
            var flag = this.email_check() && this.psw_check();
            if (!flag) {
                alert("输入有误，请重新输入");
                return;
            }
            //注册接口
            axios({
                    method: 'post',
                    url: "/index/get_register",
                    data: app._data.register
                })
                .then((res) => {
                    console.log(res.data);
                    if (res.data.count == 1)
                        window.location.href = "index.html";
                    else
                        alert(res.data.errMsg);
                })
                .catch((err) => {
                    console.log(err);
                })
        },
        get_uname() {
            //获取随机用户名
            axios.get("/index/get_uname")
                .then(res => {
                    console.log(res.data);
                    app._data.register.uname = res.data;
                    $(".name_check_tip").css("display", "none");
                })
                .catch(err => {
                    console.error(err);
                })
        },
        getMailCode() {
            axios({
                    method: "post",
                    url: "/index/send_code",
                    data: {
                        mail_to: app._data.register.uemail
                    }
                })
                .then(res => {
                    console.log(res.data);
                })
                .catch(err => {
                    console.error(err);
                })
        }
    }
})