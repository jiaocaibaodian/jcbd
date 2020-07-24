//upload 页面对应js
$(function() {
    $("body").keydown(function() {
        var event = window.event;
        if (event.keyCode == 13) {
            $(".el-main .el-input .el-button").click();
        }
    })
})
var uploadPage = new Vue({
    el: "#upload",
    data() {
        return {
            activeIndex: '4',
            fileData: '', // 文件上传数据（多文件合一）
            fileList: [], // upload多文件数组
            fieldData: {
                labels: [],
                types: ['视频', '链接', '电子书籍', '短篇博客', '教材', '答案'],
                type: "",
                selectedLabels: "",
                selectedGroup: {
                    id: "",
                    value: ""
                },
                group: [],
                rgname: "",
                author: "",
                rorigin: "",
                keywords: ""
            },
            imageUrl: '',
            labelDialog: {
                dialogVisible: false,
                parentLabel: {
                    lname: "",
                    lclass: 1,
                    attachl: ""
                },
                labels: [],
                showAll: false,
                newlname: ""
            }
        }
    },
    created: function() {
        //初始化fieldData.labels和fieldData.types
        axios.get("/resource/get_label")
            .then(res => {
                console.log(res.data);
                this.fieldData.labels = res.data;
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
        handleGroupChange(val) {
            for (let i = 0; i < this.fieldData.group.length; i++) {
                if (this.fieldData.group[i].value == val) {
                    this.selectedGroup.id = this.fieldData.group[i].id;
                    console.log(this.selectedGroup);
                    return;
                }
            }
        },
        create_group() {
            //判断rgname是否为空
            if (!this.fieldData.rgname) {
                this.$message({
                    message: '请先输入组名',
                    type: 'warning'
                })
                return;
            }
            //访问后端，在资源组表中插入一条记录,并返回用户名
            axios({
                    method: 'post',
                    url: "/resource/create_group",
                    data: {
                        rgname: this.fieldData.rgname
                    }
                })
                .then(res => {
                    console.log(res.data);
                    this.fieldData.group.push({
                        id: res.data.rgid,
                        value: res.data.rgname
                    })
                    this.fieldData.rgname = "";
                    this.fieldData.selectedGroup.id = res.data.rgid;
                    this.fieldData.selectedGroup.value = res.data.rgname;
                })
                .catch(err => {
                    console.log(err);
                })
        },

        //上传封面
        handleAvatarSuccess(res, file) {
            this.imageUrl = URL.createObjectURL(file.raw);
            console.log(res);
        },
        beforeAvatarUpload(file) {
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                this.$message.error('上传封面图片大小不能超过 2MB!');
            }
            return isLt2M;
        },
        // 上传文件
        uploadFile(file) {
            this.fileData.append('files[]', file.file); // append增加数据
        },

        // 上传到服务器
        submitUpload() {
            let fieldData = this.fieldData; // 缓存，注意，fieldData不要与fileData看混
            if (this.fileList.length === 0) {
                this.$message({
                    message: '请先选择文件',
                    type: 'warning'
                })
            } else {
                this.fileData = new FormData(); // new formData对象
                this.$refs.upload.submit(); // 提交调用uploadFile函数
                this.fileData.append("labels", fieldData.selectedLabels);
                this.fileData.append("rtype", fieldData.type);
                this.fileData.append("rgid", fieldData.selectedGroup.id)
                this.fileData.append("rgname", fieldData.selectedGroup.value);
                this.fileData.append("rauthor", fieldData.author)
                this.fileData.append("rorigin", fieldData.rorigin)
                this.fileData.append("keywords", fieldData.keywords)
                axios.post("/resource/uploadFile", this.fileData).then((res) => {
                    console.log(res.data);
                });
            }
        },
        //移除
        handleRemove(file, fileList) {
            this.fileList = fileList;
            // return this.$confirm(`确定移除 ${ file.name }？`);
        },

        // 选取文件超过数量提示
        handleExceed(files, fileList) {
            this.$message.warning(`当前限制选择 5 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`);
        },

        //监控上传文件列表
        handleChange(file, fileList) {
            let existFile = fileList.slice(0, fileList.length - 1).find(f => f.name === file.name);
            if (existFile) {
                this.$message.error('当前文件已经存在!');
                fileList.pop();
            }
            this.fileList = fileList;
        },
        handleLabelChange(val) {
            console.log(val);
            for (let i = 0; i < this.labelDialog.labels.length; i++) {
                if (this.labelDialog.labels[i].lname == val[val.length - 1]) {
                    this.labelDialog.parentLabel = this.labelDialog.labels[i];
                    return;
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
                    this.fieldData.labels = res.data;
                    axios.get("/resource/getUnorgLabels")
                        .then(res => {
                            console.log(res.data);
                            this.labelDialog.labels = res.data;
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
            types: ['全部', '视频', '链接', '电子书籍', '短篇博客', '教材', '答案'],
            selectedType: "全部",
            resources: [],
            labels: [],
            selectedLabels: "",
            query: "",
            searchResults: [],
            mode: "none"
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
            axios.get("/resource/get_resource")
                .then(res => {
                    console.log(res.data);
                    this.resources.push.apply(this.resources, res.data.data);
                })
                .catch(err => {
                    console.error(err);
                })
        },
        getSearchResults() {
            axios.get("/resource/get_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType + "&pageIndex=1")
                .then(res => {
                    console.log(res.data);
                    var reg = new RegExp(this.query);
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
        getTempSearchResults() {
            axios.get("/resource/get_temp_search_results?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType)
                .then(res => {
                    this.searchResults = res.data;
                    var reg = new RegExp(this.query);
                    console.log(reg);
                    for (let i = 0; i < this.searchResults.length; i++) {
                        this.searchResults[i].rname = this.searchResults[i].rname.replace(reg, "<strong class='highlight'>" + this.query + "</strong>");
                        this.searchResults[i].rauthor = this.searchResults[i].rauthor.replace(reg, "<strong class='highlight'>" + this.query + "</strong>")
                    }
                    this.mode = "block";
                })
                .catch(err => {
                    console.error(err);
                })
        },
        handleClose(done) {
            done();
        },
        openFile() {
            //判断 
            var event = window.event;
            console.log(event);
            var url = event.target.parentNode.dataset.rsrc;
            if (url == undefined) {
                url = event.target.dataset.rsrc;
            }
            console.log(url);
            window.open("/pdf.js/web/viewer.html?file=" + url);
            //前往电子书籍详情页面
        },
        openVideo() {
            //前往视频详情页面
        },
        addToShelf() {
            //加入书架
            console.log(this.detail);
            axios({
                    method: 'post',
                    url: "/resource/addToShelf",
                    data: {
                        rid: this.detail.resource.rid
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