//upload 页面对应js
$(function() {
    $("body").keydown(function() {
        var event = window.event;
        if (event.keyCode == 13) {
            $(".el-main .el-input .el-button").click();
        }
    })
})

//index 页面对应js
var indexPage = new Vue({
    el: "#index",
    data() {
        return {
            activeIndex: '4',
            selectedType: { label: "全部", value: "" },
            types: [{
                label: "全部",
                value: "#"
            }, {
                label: "视频",
                value: "#videos"
            }, {
                label: "链接",
                value: "#links"
            }, {
                label: "电子书籍",
                value: "#books"
            }, {
                label: "短篇博客",
                value: "#articles"
            }, {
                label: "教材",
                value: "#textbooks"
            }, {
                label: "答案",
                value: "#answers"
            }],
            resources: [],
            labels: [],
            selectedLabels: "",
            query: "",
            searchResults: [],
            // mode: "none"
        }
    },
    created: function() {
        this.getResource();
        axios.get("/resource/get_label")
            .then(res => {
                console.log(res.data);
                this.labels = res.data;
            })
            .catch(err => {
                console.log(err);
            })
            //初始化用户已经建立的组名
        axios.get("/resource/get_group")
            .then(res => {
                console.log(res.data);
                this.fieldData.group = res.data;
            })
            .catch(err => {
                console.error(err);
            })
            //获取无组织形式的标签书架
        axios.get("/resource/getUnorgLabels")
            .then(res => {
                console.log(res);
                this.labelDialog.labels = res.data;
            })
            .catch(err => {
                console.error(err);
            })
    },
    methods: {
        getResource() {
            axios.get("/resource/get_resource?rtype=" + "全部")
                .then(res => {
                    console.log(res.data);
                    res.data.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.resources.push.apply(this.resources, res.data.data);
                })
                .catch(err => {
                    console.error(err);
                })
        },
        getTempSearchResults() {
            axios.get("/resource/get_temp_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType.label)
                .then(res => {
                    //json格式化
                    res.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.searchResults = res.data;
                    var reg = new RegExp(this.query);
                    console.log(reg);
                    for (let i = 0; i < this.searchResults.length; i++) {
                        this.searchResults[i].rname = this.searchResults[i].rname.replace(reg, "<strong class='highlight'>" + this.query + "</strong>");
                        this.searchResults[i].rauthor = this.searchResults[i].rauthor.replace(reg, "<strong class='highlight'>" + this.query + "</strong>")
                    }
                })
                .catch(err => {
                    console.error(err);
                })
        },
        handleClose(done) {
            done();
        },
        openFile(rid) {
            //前往电子书籍详情页面
            window.open("/resource/book_detail?rid=" + rid);
        },
        openVideo(url, rid) {
            //前往视频详情页面
            window.open("/resource/video_detail?url=" + url + "&rid=" + rid);
        },
        openTextBook(rid) {
            //前往教材主页
            window.open("/resource/textbook_detail?rid=" + rid);
        },
        openArticle(rid) {
            window.open("/resource/article_detail?rid=" + rid);
        },
        addToShelf($rid) {
            //加入书架
            axios({
                    method: 'post',
                    url: "/resource/addToShelf",
                    data: {
                        rid: $rid
                    }
                })
                .then(res => {
                    console.log(res.data);
                    this.$message({
                        type: "success",
                        message: "加入书架成功"
                    })
                })
                .catch(err => {
                    console.error(err);
                })
        },
        showResults() {
            //首先检查用户是否有输入查询字段
            // if (this.query==""){
            //     this.$message({
            //         message:
            //     })
            // }
        },
        handleTypeChange(val) {
            console.log(val);
            this.types.forEach(element => {
                if (element.label == val) {
                    window.location.href = element.value;
                    return;
                }
            });
        },
        getSearchResults() {
            axios.get("/resource/get_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType.label + "&pageIndex=1")
                .then(res => {
                    console.log(res.data);
                    var reg = new RegExp(this.query);
                    res.data.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.resources.push.apply(this.resources, res.data.data);
                    for (let i = 0; i < this.resources.length; i++) {
                        this.resources[i].rname = this.resources[i].rname.replace(reg, "<strong class='highlight'>" + this.query + "</strong>");
                        this.resources[i].rauthor = this.resources[i].rauthor.replace(reg, "<strong class='highlight'>" + this.query + "</strong>")
                    }
                })
                .catch(err => {
                    console.error(err);
                })
        },
        handleLabelChange(val) {
            console.log(val);
            for (let i = 0; i < this.labelDialog.labels.length; i++) {
                if (this.labelDialog.labels[i].lname == val) {
                    this.labelDialog.parentLabel = JSON.parse(JSON.stringify(this.labelDialog.labels[i]));
                    break;
                }
            }
        },
        createLabel() {
            //检查父标签时候为空，如果为空那么标签等级未为1
            if (this.labelDialog.parentLabel.lname == "") {
                this.$confirm('父标签为空，确认创建一级标签吗', '提醒', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then((res) => {
                    console.log(res);
                    this.createLabelFunc(1);
                }).catch(() => {});
            } else {
                this.createLabelFunc(this.labelDialog.parentLabel.lclass + 1);
            }
        },
        createLabelFunc($lclass) {
            //检测是否输入新标签名
            if (this.labelDialog.newlname == "") {
                this.$message({
                    message: "标签名不能为空",
                    type: 'warning'
                })
                return;
            }
            //创建标签
            axios({
                    method: 'post',
                    url: "/resource/createLabel",
                    data: {
                        attachl: this.labelDialog.parentLabel.lname,
                        lname: this.labelDialog.newlname,
                        lclass: $lclass
                    }
                })
                .then(res => {
                    console.log(res.data);
                    this.isResourceShow++;
                    this.fieldData.labels = res.data;
                    axios.get("/resource/getUnorgLabels")
                        .then(res => {
                            console.log(res.data);
                            this.labelDialog.labels = res.data;
                            this.$message({
                                message: "创建成功",
                                type: "success"
                            });
                            //关闭弹窗
                            this.labelDialog.dialogVisible = false;
                            this.fieldData.selectedLabels = this.labelDialog.newlname;
                            //清空输入框
                            this.labelDialog.newlname = "";
                        })
                        .catch(err => {
                            console.error(err);
                        })
                })
                .catch(err => {
                    console.log(err);
                })
        },
        getRandomBgColor() {
            str = '0123456789ABCDEF';
            estr = '#';
            len = str.length;
            for (let i = 1; i <= 6; i++) {
                $num = Math.floor(Math.random() * len);
                estr = estr + str[$num];
            }
            return estr;
        }
    }
})

//index 页面对应js
var indexPage = new Vue({
    el: "#index",
    data() {
        return {
            activeIndex: '4',
            selectedType: { label: "全部", value: "" },
            types: [{
                label: "全部",
                value: "#"
            }, {
                label: "视频",
                value: "#videos"
            }, {
                label: "链接",
                value: "#links"
            }, {
                label: "电子书籍",
                value: "#books"
            }, {
                label: "短篇博客",
                value: "#articles"
            }, {
                label: "教材",
                value: "#textbooks"
            }, {
                label: "答案",
                value: "#answers"
            }],
            resources: [],
            labels: [],
            selectedLabels: "",
            query: "",
            searchResults: [],
            // mode: "none"
        }
    },
    created: function() {
        this.getResource();
        axios.get("/resource/get_label")
            .then(res => {
                console.log(res.data);
                this.labels = res.data;
            })
            .catch(err => {
                console.log(err);
            })
    },
    methods: {
        getResource() {
            axios.get("/resource/get_resource?rtype=" + "全部")
                .then(res => {
                    console.log(res.data);
                    res.data.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.resources.push.apply(this.resources, res.data.data);
                })
                .catch(err => {
                    console.error(err);
                })
        },
        getTempSearchResults() {
            axios.get("/resource/get_temp_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType.label)
                .then(res => {
                    //json格式化
                    res.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.searchResults = res.data;
                    var reg = new RegExp(this.query);
                    console.log(reg);
                    for (let i = 0; i < this.searchResults.length; i++) {
                        this.searchResults[i].rname = this.searchResults[i].rname.replace(reg, "<strong class='highlight'>" + this.query + "</strong>");
                        this.searchResults[i].rauthor = this.searchResults[i].rauthor.replace(reg, "<strong class='highlight'>" + this.query + "</strong>")
                    }
                })
                .catch(err => {
                    console.error(err);
                })
        },
        handleClose(done) {
            done();
        },
        openFile(rid, url) {
            //前往电子书籍详情页面
            window.open("/resource/book_detail?url=" + url + "&rid=" + rid)
        },
        openVideo(url, rid) {
            //前往视频详情页面
            window.open("/resource/video_detail?url=" + url + "&rid=" + rid)
        },
        addToShelf($rid) {
            //加入书架
            axios({
                    method: 'post',
                    url: "/resource/addToShelf",
                    data: {
                        rid: $rid
                    }
                })
                .then(res => {
                    console.log(res.data);
                    this.$message({
                        type: "success",
                        message: "加入书架成功"
                    })
                })
                .catch(err => {
                    console.error(err);
                })
        },
        showResults() {
            //首先检查用户是否有输入查询字段
            // if (this.query==""){
            //     this.$message({
            //         message:
            //     })
            // }
        },
        handleTypeChange(val) {
            console.log(val);
            this.types.forEach(element => {
                if (element.label == val) {
                    window.location.href = element.value;
                    return;
                }
            });
        },
        getSearchResults() {
            axios.get("/resource/get_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType.label + "&pageIndex=1")
                .then(res => {
                    console.log(res.data);
                    var reg = new RegExp(this.query);
                    res.data.data.forEach(element => {
                        element.labels = JSON.parse(element.labels);
                    });
                    this.resources.push.apply(this.resources, res.data.data);
                    for (let i = 0; i < this.resources.length; i++) {
                        this.resources[i].rname = this.resources[i].rname.replace(reg, "<strong class='highlight'>" + this.query + "</strong>");
                        this.resources[i].rauthor = this.resources[i].rauthor.replace(reg, "<strong class='highlight'>" + this.query + "</strong>")
                    }
                })
                .catch(err => {
                    console.error(err);
                })
        },
    }
})