<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;
use think\facade\Request;
use think\facade\View;
use think\Validate;
class Login extends BaseController
{
    public function index(){
        return View::fetch("uname");
    }
    //暂时存放此处
    public function magiccude()
    {
        return View::fetch();
    }
    public function resetkey()
    {
        return View::fetch();
    }
    public function uname(){
        return View::fetch();
    }
    public function email(){
        return View::fetch();
    }
    public function signin(){
        return View::fetch();
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
                    setcookie("token", $token, time() + 3600*24, "/");
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
            setcookie("token", $token, time() + 3600*24, "/");
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
    public function get_ResetKey(){
        session_start();
        $_POST = Request::post();
        //检查验证码
        if ($_SESSION['mailCode'] != $_POST['mailCode']) {
            return json(["code" => 0, "errMsg" => "验证码输入错误"]);
        }
        //检查该邮箱或用户名是否存在
        $data1 = Db::table("user")->where("uemail", $_POST['uemail'])->select();
        if (count($data1) == 0) {
            return json(['code'=>0,'errMsg'=>"不存在该用户,请检查您是否输入错误"]);
        }else{
            //根据邮箱号找到用户,拿到用户名
            $user = Db::table("user")->where("uemail",$_POST['uemail'])->find();
            $uname = $user['uname'];
            //重新生成token
            $token = md5($uname . time() . $_POST['upsw']);
            //更新用户密码和token
            Db::table("user")->where("uemail",$_POST['uemail'])->update(["upsw"=>$_POST['upsw'],"token"=>$token]);
            //更新cookie中的token
            setcookie("token", $token, time() + 3600*24, "/");
            return json(['code'=>1,"msg"=>"重置密码完整，请重新登录"]);
        }
    }
    public function register_check(){
        $uemail = input("param.uemail");
        $data = Db::table("user")->where("uemail", $uemail)->select();
        return count($data)==0;
    }
}