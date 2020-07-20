//upload 页面对应js
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
                rname: "",
                keywords: ""
            },
            imageUrl: ''
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
                this.fileData.append("rname", fieldData.rname)
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
            resources: [{
                rname: "计算机组成原理",
                rauthor: "魏风起",
                rcover: "https://pic3.zhimg.com/v2-9cdbe04508b8ab89b34be51dcd1ca695_b.jpg",
                rorigin: "https://www.runoob.com/php/php-ajax-php.html",
                labels: ["计算机", "人工智能", "机器学习"]
            }],
            labels: [],
            selectedLabels: [],
            query: "",
            searchResults: [],
            mode: "none"
        }
    },
    created: function() {
        axios.get("/resource/get_label")
            .then(res => {
                console.log(res.data);
                this.labels = res.data;
            })
            .catch(err => {
                console.log(err);
            })
            //分页获取资源
        this.getResource();
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
        searchResource() {
            axios.get("/resource/search_resource?query=" + this.query + "&labels=" + this.selectedLabels + "&type=" + this.selectedType)
                .then(res => {
                    console.log(res.data);
                    // this.searchResults = res.data;
                    // this.mode = "block";
                })
                .catch(err => {
                    console.error(err);
                })
        },
        toSearchResults() {
            window.location.href = "/resource/searchResults?query=" + this.query + "&labels=" + this.selectedlabels + "&type=" + this.selectedType;
        }
    }
})