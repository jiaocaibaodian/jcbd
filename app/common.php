<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006-2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author:
// +----------------------------------------------------------------------

// 邮箱
use think\facade\Db;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
function mailto($to, $nickname, $title, $content)
{
    // 实例化
    $mail = new PHPMailer(true);
    try {
        //Server settings
        $mail->SMTPDebug = 2;                                 // Enable verbose debug output   2调试模式 0用户模式
        $mail->isSMTP();                                      // Set mailer to use SMTP
        $mail->CharSet = 'utf-8';                         // 设置邮件格式编码
        $mail->Host = 'smtp.qq.com';                          // Specify main and backup SMTP servers   smtp服务器的名称
        $mail->SMTPAuth = true;                               // Enable SMTP authentication
        $mail->Username = '@qq.com';                 // SMTP username
        $mail->Password = '';                           // SMTP password   此为QQ授权码。
        $mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted   目前规定必须使用ssl，非ssl的协议已经不支持了
        $mail->Port = 465;                                    // TCP port to connect to   ssl协议，端口号一般是465

        //Recipients
        $mail->setFrom('@qq.com', 'jcbd管理员'); // 设置邮件发送人信息(邮箱, 昵称)
        $mail->addAddress($to, $nickname);     // 设置收件人信息(邮箱, 昵称)
//        $mail->addAddress('ellen@example.com');               // Name is optional
//        $mail->addReplyTo('info@example.com', 'Information');
//        $mail->addCC('cc@example.com');
//        $mail->addBCC('bcc@example.com');
//
//        //Attachments 附件
//        $mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
//        $mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name

        //Content
        $mail->isHTML(true);                                  // Set email format to HTML
        $mail->Subject = $title;                          // 设置发送的邮件标题
        $mail->Body    = $content;                            // 设置邮件发送内容
//        $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

        return $mail->send();
    } catch (Exception $e) {
        exception($mail->ErrorInfo,1001);                 // 失败抛出错误信息
    }
}
function objectToArray($object)
{
    $array = array();
    if (is_object($object)) {
       foreach ($object as $key => $value) {
          $array[$key] = $value;
       }
    } else {
       $array = $object;
    }
    return $array;
}
function recurGetLabels($data,&$root){
    foreach ($data as $key=>$item) {
        $root[$key]["label"] = $item['lname'];
        $root[$key]["value"] = $item['lname'];
        $data2 = Db::table("label")->where("attachl",$item['lname'])->select();
        if (count($data2)!=0){
            $root[$key]["children"] = array();
            recurGetLabels($data2,$root[$key]["children"]);
        }
    }
}
function getUnameByToken(){
    $token = $_COOKIE['token'];
    $data = Db::table("user")->where("token",$token)->find();
    return $data['uname'];
}

// function data_format(&$data){
//     foreach ($data as $key => $value) {
//         $value['labels'] = json_decode($value['labels']);
//     }
// }
function comment_data_format($data){        //格式化评论数据
    $commentids = [];
    $result = [];
    $j = 0;
    for ($i = 0; $i < count($data); $i++) {
        $index = array_search($data[$i]["replyToid"],$commentids);
        if ($data[$i]['replyTouname']=="") {
            $result[$j] = [
                'id' => $data[$i]['id'],
                'rid' => $data[$i]['rid'],
                'uname' => $data[$i]['uname'],
                'content' => $data[$i]['content'],
                'uavator' => $data[$i]['uavator'],
                'replies' => [],
            ];
            $commentids[$j] = $data[$i]['id'];
            $j++;
        } else {
            $temp = $data[$i];
            $temp['replyCollapse'] = true;
            $result[$index]['replies'][] = $temp;
        }
    }
    return $result;
}