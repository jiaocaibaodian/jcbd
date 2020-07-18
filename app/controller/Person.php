<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;
use think\facade\Request;
use think\facade\View;
use think\Validate;
class Person extends BaseController
{
    public function index(){
        if (!array_key_exists('token',$_COOKIE))
            return redirect('/login');
        else   
            return View::fetch();
    }
}