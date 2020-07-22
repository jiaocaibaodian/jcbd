<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;
use think\facade\Request;
use think\facade\View;
use think\Validate;

class Resource extends BaseController
{
    public function index()
    {
        if (!array_key_exists('token', $_COOKIE)) {
            return redirect('/login');
        } else {
            return View::fetch();
        }

    }
    public function upload()
    {
        if (!array_key_exists('token', $_COOKIE)) {
            return redirect('/login');
        } else {
            return View::fetch();
        }
    }
    public function searchResults(){
        if (!array_key_exists('token', $_COOKIE)) {
            return redirect('/login');
        } else {
            return View::fetch();
        }
    }
    public function uploadFile() //资源上传接口
    {
        $_POST = Request::post();
        \session_start();
        // 获取表单上传文件
        $files = request()->file("files");
        $uname = \getUnameByToken();
        try {
            validate(['files' => 'filesize:102400000|fileExt:jpg,gif,pdf,jpeg,png,mp3,mp4'])
                ->check($files);
            //验证通过，将资源存放到服务器
            $savename = [];
            foreach ($files as $file) {
                $savename[] = \think\facade\Filesystem::disk('public')->putFile('resources', $file);
                //在资源表中更新该资源的信息，包括作者，来源，类型，标签，存储路径等等
                $rid = $file->md5();

                $data = [
                    "rid" => $rid,
                    "rname" => $_POST['rname'],
                    "rcover" => "/storage/" . $_SESSION['imageSrc'],
                    "rtype" => $_POST['rtype'],
                    "rsrc" => "/storage/" . $savename[count($savename) - 1],
                    "rorigin" => $_POST['rorigin'],
                    "rauthor" => $_POST['rauthor'],
                    "keywords" => $_POST['keywords'],
                ];
                Db::table("resource")->replace()->insert($data);
                //更新资源标签表
                $labels = explode(",", $_POST['labels']);
                foreach ($labels as $item) {
                    $data = [
                        "rid" => $rid,
                        "lname" => $item,
                    ];
                    Db::table("res_lab")->replace()->insert($data);
                }
                //更新资源组表，插入新增资源组记录
                if ($_POST['rgid']!=""){
                    $data = [
                        "rgid"=>$_POST['rgid'],
                        "rgname"=>$_POST['rgname'],
                        "rid"=>$rid,
                        "uname"=>$uname
                    ];
                    Db::table("rgroup")->replace()->insert($data);
                }
                //更新upload表，插入用户上传记录
                $data = [
                    "uname"=>$uname,
                    "rid"=>$rid,
                    "rname"=>$_POST['rname'],
                    "rsrc"=>"/storage/".$savename[count($savename)-1]
                ];
                Db::table("upload")->replace()->insert($data);
            }
            //删除资源组表中建表时的默认资源
            Db::table("rgroup")->where(['rid' => "000001", 'rgid' => $_POST['rgid']])->delete();
            return json(["code" => 1, "msg" => "上传成功"]);
        } catch (\think\exception\ValidateException $e) {
            echo $e->getMessage();
        }
    }
    public function upload_cover()
    {
        //上传封面
        $image = request()->file();
        try {
            validate(['image' => 'fileExt:jpg,png,gif,jpeg'])
                ->check($image);
            $savename = \think\facade\Filesystem::disk('public')->putFile('cover', $image['image']);
            \session_start();
            $_SESSION['imageSrc'] = $savename;
        } catch (\think\exception\ValidateException $e) {
            echo $e->getMessage();
        }
    }
    public function get_label()
    {
        $data = Db::table("label")->where("lclass", 1)->select();
        $root = array();
        recurGetLabels($data, $root);
        return json($root);
    }
    public function get_group()
    {
        //根据token取得用户名
        $uname = getUnameByToken();
        //获得该用户的资源组数据
        $data = Db::table("rgroup")->where("uname", $uname)->group("rgid")->select();
        //转换数据格式
        $need = [];
        foreach ($data as $key => $item) {
            $need[$key]["id"] = $item['rgid'];
            $need[$key]["value"] = $item["rgname"];
        }
        return json($need);
    }
    public function create_group(){
        //插入一条记录
        $rgname = Request::post("rgname");
        //根据token拿到用户名
        $uname = \getUnameByToken();
        $rgid = \uniqid();
        Db::table("rgroup")->insert([
            "rgid" => $rgid,
            "rgname" => $rgname,
            "rid" => "000001",
            "uname" => $uname,
        ]);
        return json([
            "rgid" => $rgid,
            "rgname" => $rgname,
        ]);
    }
   public function get_resource()      //资源页面的查询
    {
        //分页查询，视图查询，双表连接查询
        $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')
            ->order('rid', 'desc')->paginate(20)->toArray();
        data_format($data['data']);
        return json($data);
    }
    public function get_search_results(){      //资源搜索结果页面的查询
        $query = input("param.query");
        $labels = input("param.labels");
        $type = input("param.type");
        $pageSize = input("param.pageSize");
        $labs = \explode(",", $labels);
        $temp = "(";
        for ($i=0;$i<count($labs);$i++){
            $temp=$temp."\"".$labs[$i]."\",";
        }
        $temp = mb_substr($temp,0,\mb_strlen($temp)-1).")";
        $data = [];
        if ($type=="全部"&&$labels==""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords","like","%$query%")
            ->order('rid', 'desc')->paginate(20)->toArray();
        }elseif($type=="全部"&&$labels!=""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords","like","%$query%")->where("res_lab.lname in $temp")
            ->order('rid', 'desc')->paginate(20)->toArray();
        }elseif($type!="全部"&&$labels==""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype=\"$type\"")->where("rname|rauthor|keywords","like","%$query%")
            ->order('rid', 'desc')->paginate(20)->toArray();
        }else{
            $data =  Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype like \"$type\"")->where("rname|rauthor|keywords","like","%$query%")->where("res_lab.lname in $temp")
            ->order('rid', 'desc')->paginate(20)->toArray();
        }
        data_format($data['data']);
        return json($data);
    }
    public function get_temp_search_results()   //资源页面的临时搜索
    {
        $query = input("param.query");
        $labels = input("param.labels");
        $type = input("param.type");
        $pageSize = input("param.pageSize");
        $labs = \explode(",", $labels);
        $temp = "(";
        for ($i=0;$i<count($labs);$i++){
            $temp=$temp."\"".$labs[$i]."\",";
        }
        $temp = mb_substr($temp,0,\mb_strlen($temp)-1).")";
        $data = [];
        if ($type=="全部"&&$labels==""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords","like","%$query%")
            ->select()->toArray();
        }elseif($type=="全部"&&$labels!=""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords","like","%$query%")->where("res_lab.lname in $temp")
            ->select()->toArray();
        }elseif($type!="全部"&&$labels==""){
            $data = Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype=\"$type\"")->where("rname|rauthor|keywords","like","%$query%")
            ->select()->toArray();
        }else{
            $data =  Db::view('resource', 'rid,rname,rcover,rsrc,rorigin,rauthor')
            ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype like \"$type\"")->where("rname|rauthor|keywords","like","%$query%")->where("res_lab.lname in $temp")
            ->select()->toArray();
        }
        data_format($data,5);
        return json($data);
    }
}
