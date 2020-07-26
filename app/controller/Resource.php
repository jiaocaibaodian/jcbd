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
    public function searchResults()
    {
        if (!array_key_exists('token', $_COOKIE)) {
            return redirect('/login');
        } else {
            return View::fetch();
        }
    }
    public function book_detail()
    {
        return View::fetch();
    }
    public function video_detail()
    {
        return View::fetch();
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
                    "rname" => $file->getOriginalName(),
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
                if ($_POST['rgid'] != "") {
                    $data = [
                        "rgid" => $_POST['rgid'],
                        "rgname" => $_POST['rgname'],
                        "rid" => $rid,
                        "uname" => $uname,
                    ];
                    Db::table("rgroup")->replace()->insert($data);
                }
                //更新upload表，插入用户上传记录
                $data = [
                    "uname" => $uname,
                    "rid" => $rid,
                    "rname" => $file->getOriginalName(),
                    "rsrc" => "/storage/" . $savename[count($savename) - 1],
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
    public function getUnorgLabels()
    {
        $data = Db::table("label")->group("lname")->select();
        return json($data);
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
    public function create_group()
    {
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
    public function get_resource() //资源页面的查询

    {
        //分页查询，视图查询，双表连接查询
        $data = Db::view('resource', 'rid,rname,rcover,rsrc,rtype,rorigin,rauthor')
            ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')
            ->order('rid', 'desc')->paginate(100)->toArray();
        data_format($data['data']);
        return json($data);
    }
    public function get_search_results()
    { //资源搜索结果页面的查询
        $query = input("param.query");
        $labels = input("param.labels");
        $type = input("param.type");
        $pageSize = input("param.pageSize");
        $labs = \explode(",", $labels);
        $temp = "(";
        for ($i = 0; $i < count($labs); $i++) {
            $temp = $temp . "\"" . $labs[$i] . "\",";
        }
        $temp = mb_substr($temp, 0, \mb_strlen($temp) - 1) . ")";
        $data = [];
        if ($type == "全部" && $labels == "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords", "like", "%$query%")
                ->order('rid', 'desc')->paginate(20)->toArray();
        } elseif ($type == "全部" && $labels != "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords", "like", "%$query%")->where("res_lab.lname in $temp")
                ->order('rid', 'desc')->paginate(20)->toArray();
        } elseif ($type != "全部" && $labels == "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype=\"$type\"")->where("rname|rauthor|keywords", "like", "%$query%")
                ->order('rid', 'desc')->paginate(20)->toArray();
        } else {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype like \"$type\"")->where("rname|rauthor|keywords", "like", "%$query%")->where("res_lab.lname in $temp")
                ->order('rid', 'desc')->paginate(20)->toArray();
        }
        data_format($data['data']);
        return json($data);
    }
    public function get_temp_search_results() //资源页面的临时搜索

    {
        $query = input("param.query");
        $labels = input("param.labels");
        $type = input("param.type");
        $pageSize = input("param.pageSize");
        $labs = \explode(",", $labels);
        $temp = "(";
        for ($i = 0; $i < count($labs); $i++) {
            $temp = $temp . "\"" . $labs[$i] . "\",";
        }
        $temp = mb_substr($temp, 0, \mb_strlen($temp) - 1) . ")";
        $data = [];
        if ($type == "全部" && $labels == "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords", "like", "%$query%")
                ->select()->toArray();
        } elseif ($type == "全部" && $labels != "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', 'resource.rid=res_lab.rid')->where("rname|rauthor|keywords", "like", "%$query%")->where("res_lab.lname in $temp")
                ->select()->toArray();
        } elseif ($type != "全部" && $labels == "") {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype=\"$type\"")->where("rname|rauthor|keywords", "like", "%$query%")
                ->select()->toArray();
        } else {
            $data = Db::view('resource', 'rid,rname,rtype,rcover,rsrc,rorigin,rauthor')
                ->view('res_lab', 'lname', "resource.rid=res_lab.rid and rtype like \"$type\"")->where("rname|rauthor|keywords", "like", "%$query%")->where("res_lab.lname in $temp")
                ->select()->toArray();
        }
        data_format($data, 5);
        return json($data);
    }
    public function addToShelf()
    {
        //加入书架（视频库）
        //先获取uname
        $uname = \getUnameByToken();
        $rid = Request::post("rid");
        $result = Db::table("user_shelf")->replace()->insert([
            "uname" => $uname,
            "rid" => $rid,
        ]);
        if ($result) {
            return json([
                "count" => $result,
                "msg" => "加入成功",
            ]);
        } else {
            return json([
                "count" => $result,
                "errMsg" => "加入失败",
            ]);
        }
    }
    public function createLabel()
    {
        $_POST = Request::post();
        Db::table("label")->replace()->insert([
            "lname" => $_POST['lname'],
            "attachl" => $_POST['attachl'],
            "lclass" => $_POST['lclass'],
        ]);
        return $this->get_label();
    }
    public function getRgroupById()
    {
        $rid = \input("param.rid");
        $rgroup = Db::table("rgroup")->field("rgid,rgname")->where("rid", $rid)->findOrEmpty();
        if (empty($rgroup)) {
            return json([
                'ingroup' => false,
                'resources'=>[]
            ]);
        }
        $result = Db::view("rgroup")->view("resource", "rid,rname,rtype,rcover,rsrc,rorigin,rauthor", "resource.rid=rgroup.rid")->where("rgid", $rgroup['rgid'])->select();
        return json([
            "ingroup" => true,
            "rgroup" => $rgroup,
            "resources" => $result,
        ]);
    }
    public function addUserComment()
    {
        //获取post提交数据
        $_POST = Request::post();
        //获取用户身份，包括头像，用户名
        $userinfo = Db::table("user")->where("token", $_COOKIE['token'])->find();
        $uname = $userinfo['uname'];
        $uavator = $userinfo['uavator'];
        //在评论表中插入数据，增加用户评论记录
        $result = Db::table("user_comment")->insert([
            "uname" => $uname,
            "rid" => $_POST['rid'],
            "content" => $_POST['content'],
            "replyToid"=>$_POST['replyToid'],
            "replyTouname" => $_POST['replyTouname']
        ]);
        $id = Db::table("user_comment")->max("id");
        if ($_POST['replyTouname'] == "") {
            return json([
                "uavator" => $uavator,
                "uname" => $uname,
                "id"=>$id,
                "rid" => $_POST['rid'],
                "content" => $_POST['content'],
                "replies" => []
            ]);
        } else {
            return json([
                "uavator" => $uavator,
                "uname" => $uname,
                "comment_id"=>$id,
                "replyToid" => $_POST['replyToid'],
                "replyTouname"=>$_POST['replyTouname'],
                "replyCollapse" => true,
                "rid" => $_POST['rid'],
                "content" => $_POST['content']
            ]);
        }
    }
    public function getUserComments(){
        $rid = input("param.rid");
        $data = Db::view("user_comment","id,uname,rid,content,replyTouname,replyToid")->view("user","uavator","user.uname=user_comment.uname")->where("rid",$rid)->select();
        $fdata = comment_data_format($data);
        return json($fdata);
    }
}
