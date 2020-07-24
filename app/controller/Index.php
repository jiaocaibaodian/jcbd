<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;
use think\facade\Request;
use think\facade\View;
use think\Validate;
class Index extends BaseController
{
    public function index()
    {
        return View::fetch();
    }
}
