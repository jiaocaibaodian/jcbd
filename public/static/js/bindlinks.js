$(function() {
    // var header = "http://www.rcloud.cn";
    $(".el-header .el-menu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/index";
    })
    $(".el-header .el-menu .el-menu-item:eq(4)").click(function() {
        window.location.href = "/resource";
    })
    $(".el-header .el-menu .el-submenu .el-menu-item:eq(0)").click(function() {
        window.location.href = "/login";
    })
    $(".el-header .el-menu .el-submenu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/login/signin";
    })
    $(".el-header .el-menu .el-submenu .el-menu-item:eq(2)").click(function() {
        window.location.href = "/shelf";
    })
})