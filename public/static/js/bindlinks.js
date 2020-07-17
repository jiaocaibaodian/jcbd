$(function() {
    $("#app .el-header .el-menu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/index";
    })
    $("#app .el-header .el-menu .el-menu-item:eq(4)").click(function() {
        window.location.href = "/index/resource";
    })
    $("#app .el-header .el-menu .el-submenu .el-menu-item:eq(0)").click(function() {
        window.location.href = "/index/login";
    })
    $("#app .el-header .el-menu .el-submenu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/index/signin";
    })
})