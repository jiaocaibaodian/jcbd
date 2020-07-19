var app = new Vue({
    el: "#app",
    data() {
        return {
            login: {
                uname: "",
                uemail: "",
                upsw: "",
                rmpsw: false,
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
    created: function() {
        console.log(this.login);
        var uname = $.cookie("uname");
        var uemail = $.cookie("uemail");
        var upsw = $.cookie("upsw");
        if (uname) {
            this.login.uname = uname;
            this.login.uemail = uemail;
            this.login.upsw = upsw;
            this.login.rmpsw = true;
        }
    },
    methods: {
        get_login() {
            var loginData = {};
            if (this.login.uname == "") { //邮箱登录
                loginData = {
                    uemail: this.login.uemail,
                    upsw: this.login.upsw,
                    rmpsw: this.login.rmpsw,
                    checkcode: this.login.checkcode
                }
            } else {
                loginData = { //用户名登录
                    uname: this.login.uname,
                    upsw: this.login.upsw,
                    rmpsw: this.login.rmpsw,
                    checkcode: this.login.checkcode
                }
            }
            console.log(loginData);
            axios({
                    method: 'post',
                    url: "/login/get_login",
                    data: loginData
                })
                .then(res => {
                    console.log(res.data);
                    if (res.data.code)
                        alert(res.data.msg);
                    else {
                        alert(res.data.errMsg);
                        return;
                    }
                    //跳转到首页
                    window.location.href = "/index/";
                })
                .catch(err => {
                    console.log(err);
                })
        },
        code_check() {
            return axios({
                    method: 'post',
                    url: "/login/code_check",
                    data: {
                        checkcode: this.login.checkcode
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
            if (!regExp.test(this.register.uemail)) {
                $(".email_check_tip").css("display", "inline");
                return false;
            } else {
                $(".email_check_tip").css("display", "none");
                return true;
            }
        },
        psw_check() {
            //检测密码合法性，必须且只能包含字母和数字和下划线，
            var psw = this.register.upsw;
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
            var checkpsw = this.register.checkpsw;
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
                    url: "/login/uname_check",
                    data: {
                        uname: this.register.uname
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
        login_check() {
            //检测用户是否已经注册
            register.dialogVisible = true;
            return axios({
                    method: 'post',
                    url: "/index/login_check",
                    data: {
                        uemail: this.register.uemail
                    }
                })
                .then((res) => {
                    console.log(res.data);
                    if (res.data) {
                        $(".login_check_tip").css("display", "none");
                    } else {
                        $(".login_check_tip").css("display", "inline");
                    }
                    return res.data;
                })
        },
        get_register() {
            //this.register.dialogVisible = false;
            var flag = this.email_check() && this.psw_check();
            if (!flag) {
                alert("输入有误，请重新输入");
                return;
            }
            //注册接口
            axios({
                    method: 'post',
                    url: "/login/get_register",
                    data: this.register
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
            axios.get("/login/get_uname")
                .then(res => {
                    console.log(res.data);
                    this.register.uname = res.data;
                    $(".name_check_tip").css("display", "none");
                })
                .catch(err => {
                    console.error(err);
                })
        },
        getMailCode() {
            axios({
                    method: "post",
                    url: "/login/send_code",
                    data: {
                        mail_to: this.register.uemail
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