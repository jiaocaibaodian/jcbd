var uploadPage = new Vue({
    el: "#upload",
    data() {
        return {
            activeIndex: '4',
            fileData: '', // 文件上传数据（多文件合一）
            fileList: [], // upload多文件数组
            fieldData: {
                labels: [],
                types: ['视频', '电子书籍', '短篇博客', '教材', '答案'],
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
            },
            isResourceShow: 0
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
                    this.fieldData.selectedGroup.id = this.fieldData.group[i].id;
                    console.log(this.fieldData.selectedGroup);
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
            this.$message.warning(`当前限制选择 30 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`);
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