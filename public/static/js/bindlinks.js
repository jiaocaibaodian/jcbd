$(function() {
    $("#app .el-header .el-menu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/index";
    })
    $("#app .el-header .el-menu .el-menu-item:eq(4)").click(function() {
        window.location.href = "/resource";
    })
    $("#app .el-header .el-menu .el-submenu .el-menu-item:eq(0)").click(function() {
        window.location.href = "/login";
    })
    $("#app .el-header .el-menu .el-submenu .el-menu-item:eq(1)").click(function() {
        window.location.href = "/login/signin";
    })
    $("#app .el-header .el-menu .el-submenu .el-menu-item:eq(2)").click(function() {
        window.location.href = "/shelf";
    })
})