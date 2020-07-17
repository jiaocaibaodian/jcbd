<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;
use think\facade\Request;
use think\facade\View;
use think\Validate;
class Index extends BaseController
{
    private $imageSrc = "";
    public function index()
    {
        return View::fetch();
    }
    public function login()
    {
        return View::fetch();
    }
    public function signin()
    {
        return View::fetch();
    }
    public function emaillogin()
    {
        return View::fetch();
    }
    public function resource()
    {
        return View::fetch();
    }
    public function checkState(){
        if (array_key_exists('token',$_COOKIE)){
            return json(["code"=>1,"msg"=>"已登录"]);
        }else{
            return json(["code"=>0,"errMsg"=>"登录失效,请重新登录"]);
        }
    }
    public function get_login()
    {
        $_POST = Request::post();
        //检查验证码
        session_start();
        if (strtolower($_SESSION["checkcode"]) != strtolower($_POST['checkcode'])) {
            return json(["code" => 0, "errMsg" => "验证码输入错误"]);
        }
        //区分登录方式，根据邮箱或用户名获得该用户的完整数据
        $data = [];
        if (array_key_exists("uemail", $_POST)) {
            $data = Db::table("user")->where("uemail", $_POST['uemail'])->select();
        }

        if (array_key_exists("uname", $_POST)) {
            $data = Db::table("user")->where("uname", $_POST['uname'])->select();
        }
        //利用token检查用户登录状态
        $token = "";
        $result = [];
        if (array_key_exists("token", $_COOKIE)) {
            $token = $_COOKIE["token"];
            $result = Db::table("user")->where("token", $token)->findOrEmpty();
        }
        if (count($result) == 0) { //表示用户未登录，（cookie过期）
            //检测邮箱号或用户名是否存在
            if (count($data) > 0) { //如果存在,那么取出密码，跟post的密码对照
                if ($data[0]['upsw'] == $_POST['upsw']) { //密码一致，更新token值，返回登录成功消息
                    $token = md5($data[0]['uname'] . time() . $_POST['upsw']);
                    setcookie("token", $token, time() + 3600, "/");
                    //更新user表token值
                    Db::table("user")->where("uname",$data[0]['uname'])->update(["token"=>$token]);
                    if ($_POST['rmpsw'] == 1) {
                        setcookie("uname", $data[0]['uname'], time() + 7 * 24 * 60 * 60, "/");
                        setcookie("uemail", $data[0]['uemail'], time() + 7 * 24 * 60 * 60, "/");
                        setcookie("upsw", $data[0]['upsw'], time() + 7 * 24 * 60 * 60, "/");
                    } else {
                        setcookie("uname", "", time() - 7 * 24 * 60 * 60, "/");
                        setcookie("uemail", "", time() - 7 * 24 * 60 * 60, "/");
                        setcookie("upsw", "", time() + 7 * 24 * 60 * 60, "/");
                    }
                    return json(['code' => 1, 'msg' => "登录成功", 'uname' => $data[0]['uname']]);
                }
            } else {
                if ($_POST['rmpsw']) {
                    setcookie("uname", $data[0]['uname'], time() + 7 * 24 * 60 * 60);
                    setcookie("uemail", $data[0]['uemail'], time() + 7 * 24 * 60 * 60);
                    setcookie("upsw", $data[0]['upsw'], time() + 7 * 24 * 60 * 60);
                } else {
                    setcookie("uname", "", time() - 7 * 24 * 60 * 60);
                    setcookie("uemail", "", time() - 7 * 24 * 60 * 60);
                    setcookie("upsw", "", time() + 7 * 24 * 60 * 60);
                }
                return json(['code' => 0, 'errMsg' => "该用户不存在"]);
            }
        } else {
            return json(['code' => 2, 'msg' => "已经登录", 'uname' => $data[0]['uname']]);
        }
    }
    public function get_register() //

    {
        session_start();
        $_POST = Request::post();
        //检查验证码
        if ($_SESSION['mailCode'] != $_POST['mailCode']) {
            return json(["count" => 0, "errMsg" => "验证码输入错误"]);
        }
        //检查该邮箱或用户名是否存在
        $data1 = Db::table("user")->where("uemail", $_POST['uemail'])->select();
        $data2 = Db::table("user")->where("uname", $_POST['uname'])->select();
        if (count($data1) > 0) {
            return "邮箱已注册";
        } elseif (count($data2) > 0) {
            return "用户名已被占用";
        } else {
            //生成token
            $token = md5($_POST['uname'] . "2020-7-12" . $_POST['upsw']);
            $data = [
                "uemail" => $_POST['uemail'],
                "uname" => $_POST['uname'],
                "upsw" => $_POST['upsw'],
                "token" => $token,
            ];
            //在user表中增加该用户记录，返回插入条数及状态相关信息
            $result = Db::table("user")->insert($data);
            setcookie("token", $token, time() + 3600, "/");
            if ($result == 0) {
                return json(["count" => $result, "errMsg" => "注册失败"]);
            } else {
                return json(["count" => $result, "msg" => "注册成功"]);
            }
        }
    }
    public function get_uname() //获取用户名

    {
        $str = "abcdefghijklmnopqrstuvwxyz";
        $numstr = "1234567890";
        while (true) {
            //生成用户名
            $randStr = str_shuffle($str); //打乱字符串
            $randnum = str_shuffle($numstr); //打乱字符串
            $strlen = rand(2, 3);
            $diglen = rand(2, 6);
            $uname = substr($randStr, 0, $strlen) . substr($randnum, 0, $diglen);
            //检查用户名是否存在，存在重新生成，不存在则返回该用户名
            $data = Db::table("user")->where("uname", $uname)->findOrEmpty();
            if (count($data) == 0) {
                return $uname;
            }
        }
    }
    public function uname_check()
    { //
        $uname = Request::post("uname");
        $data = Db::table("user")->where("uname", $uname)->select()->toArray();
        return count($data) == 0;
    }
    public function get_check_img()
    {
        session_start();

        //宽
        $w = 100;
        //高
        $h = 40;

        //新建一个真彩色图像
        $image = imagecreatetruecolor($w, $h);
        //设置验证码颜色
        $bgcolor = imagecolorallocate($image, 255, 255, 255);
        //填充背景色
        imagefill($image, 0, 0, $bgcolor);
        //10>设置变量
        $captcha_code = "";

        //随机种子
        $char_str = 'abcdefghkmnprstuvwxyzABCDEFGHKMNPRSTUVWXYZ23456789';
        $char_str_len = strlen($char_str) - 1;

        $checkcode = $code = '';

        //生成随机码
        for ($i = 0; $i < 4; $i++) {
            //设置字体大小
            $fontsize = 6;
            //设置字体颜色，随机颜色
            $fontcolor = imagecolorallocate($image, rand(0, 120), rand(0, 120), rand(0, 120));
            //设置数字
            $code = substr($char_str, rand(0, $char_str_len), 1);
            //拼接验证码
            $checkcode .= $code;
            //随机码宽度
            $x = ($i * $w / 4) + rand(5, 10);
            //随机码高度
            $y = rand(5, $h / 2);
            imagestring($image, $fontsize, $x, $y, $code, $fontcolor);
        }

        //保存code到session
        $_SESSION['checkcode'] = $checkcode;

        //设置雪花点
        for ($i = 0; $i < 400; $i++) {
            //设置点的颜色
            $pointcolor = imagecolorallocate($image, rand(50, 200), rand(50, 200), rand(50, 200));
            //imagesetpixel画一个单一像素
            imagesetpixel($image, rand(0, $w), rand(0, $h), $pointcolor);
        }

        //增加干扰元素
        for ($i = 0; $i < 4; $i++) {
            //设置线的颜色
            $linecolor = imagecolorallocate($image, rand(80, 220), rand(80, 220), rand(80, 220));
            //设置线，两点一线
            imageline($image, rand(1, $w - 1), rand(1, $h - 1), rand(1, $w - 1), rand(1, $h - 1), $linecolor);
        }

        //设置图片头部
        header('Content-Type: image/png');
        //生成png图片
        imagepng($image);
        //销毁$image
        imagedestroy($image);
    }
    public function code_check()
    {
        $_POST = Request::post();
        session_start();
        if (strtolower($_SESSION["checkcode"]) == strtolower($_POST['checkcode'])) {
            return json(["code" => 1, "msg" => "验证码正确"]);
        } else {
            return json(["code" => 0, "errMsg" => "验证码输入错误"]);
        }
    }
    public function send_code()
    {
        session_start();
        $_POST = Request::post();
        $code = rand(100000, 999999);
        mailto($_POST['mail_to'], "用户", "教材宝典", "尊敬的用户，您好！您的验证码是" . $code);
        $_SESSION['mailCode'] = $code;
        return "邮件发送成功";
    }
    public function upload() //资源上传接口
    {
        $_POST = Request::post();
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
                    "rid"=>$rid,
                    "rname"=>$_POST['rname'],
                    "rcover"=>"/storage/".$this->imageSrc,
                    "rtype"=>$_POST['rtype'],
                    "rsrc"=>"/storage/".$savename[count($savename)-1],
                    "rorigin"=>$_POST['rorigin'],
                    "rauthor"=>$_POST['rauthor'],
                    "keywords"=>$_POST['keywords']
                ];
                Db::table("resource")->replace()->insert($data);
                //更新资源标签表
                $labels = explode(",",$_POST['labels']);
                foreach($labels as $item){
                    $data = [
                        "rid"=>$rid,
                        "lname"=>$item
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
            Db::table("rgroup")->where('rid',"000001")->where('rgid',$_POST['rgid'])->delete();
            return json(["code"=>1,"msg"=>"上传成功"]);
        } catch (\think\exception\ValidateException $e) {
            echo $e->getMessage();
        }
    }
    public function upload_cover(){
        //上传封面
        $image = request()->file();
        try {
            validate(['image'=>'fileExt:jpg,png,gif,jpeg'])
                ->check($image);
            $savename = \think\facade\Filesystem::disk('public')->putFile('cover', $image['image']);
            $this->imageSrc = $savename;
        } catch (\think\exception\ValidateException $e) {
            echo $e->getMessage();
        }
    }
    public function get_label(){
        $data = Db::table("label")->where("lclass",1)->select();
        $root = array();
        recurGetLabels($data,$root);
        return json($root);
    }
    public function get_group(){
        //根据token取得用户名
        $uname = getUnameByToken();
        //获得该用户的资源组数据
        $data = Db::table("rgroup")->where("uname",$uname)->select();
        //转换数据格式
        $need = [];
        foreach ($data as $key=>$item){
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
            "rgid"=>$rgid,
            "rgname"=>$rgname,
            "rid"=>"000001",
            "uname"=>$uname
        ]);
        return json([
            "rgid"=>$rgid,
            "rgname"=>$rgname
        ]);
    }
}
