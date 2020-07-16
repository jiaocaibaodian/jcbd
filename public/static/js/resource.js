var app = new Vue({
    el: "#app",
    data() {
        return {
            activeIndex: '4',
            fileData: '', // 文件上传数据（多文件合一）
            fileList: [], // upload多文件数组
        }
    },
    methods: {
        // 上传文件
        uploadFile(file) {
            this.fileData.append('files[]', file.file); // append增加数据
        },

        // 上传到服务器
        submitUpload() {
            //let fieldData = this.uploadData.fieldData; // 缓存，注意，fieldData不要与fileData看混
            if (this.fileList.length === 0) {
                this.$message({
                    message: '请先选择文件',
                    type: 'warning'
                })
            } else {
                // const isLt100M = this.fileList.every(file => file.size / 1024 / 1024 < 100);
                // if (!isLt100M) {
                //     this.$message.error('请检查，上传文件大小不能超过100MB!');
                // } else {
                this.fileData = new FormData(); // new formData对象
                this.$refs.upload.submit(); // 提交调用uploadFile函数
                axios.post("/index/upload", this.fileData).then((res) => {
                    console.log(res.data);
                });
                // }
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