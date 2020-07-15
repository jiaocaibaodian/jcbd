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