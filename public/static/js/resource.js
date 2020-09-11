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
        }
    }
})