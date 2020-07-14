ThinkPHP 6.0
===============

> 运行环境要求PHP7.1+。

[官方应用服务市场](https://www.thinkphp.cn/service) | [`ThinkPHP`开发者扶持计划](https://sites.thinkphp.cn/1782366)

ThinkPHPV6.0版本由[亿速云](https://www.yisu.com/)独家赞助发布。

## 主要新特性

* 采用`PHP7`强类型（严格模式）
* 支持更多的`PSR`规范
* 原生多应用支持
* 更强大和易用的查询
* 全新的事件系统
* 模型事件和数据库事件统一纳入事件系统
* 模板引擎分离出核心
* 内部功能中间件化
* SESSION/Cookie机制改进
* 对Swoole以及协程支持改进
* 对IDE更加友好
* 统一和精简大量用法

## 安装

~~~
composer create-project topthink/think tp 6.0.*
~~~

如果需要更新框架使用
~~~
composer update topthink/framework
~~~

## 文档

[完全开发手册](https://www.kancloud.cn/manual/thinkphp6_0/content)

## 参与开发

请参阅 [ThinkPHP 核心框架包](https://github.com/top-think/framework)。

## 版权信息

ThinkPHP遵循Apache2开源协议发布，并提供免费使用。

本项目包含的第三方源码和二进制文件之版权信息另行标注。

版权所有Copyright © 2006-2020 by ThinkPHP (http://thinkphp.cn)

All rights reserved。

ThinkPHP® 商标和著作权所有者为上海顶想信息科技有限公司。

更多细节参阅 [LICENSE.txt](LICENSE.txt)


我们从这三个页面开始
一，登录注册的页面，这个是否是同一个页面看你的设计，但我把登录注册认为是同一个。
在登录页面里你们需要提交的数据包括用户名或者邮箱号，密码,验证码;
返回的数据是：成功忽略，失败时返回用户不存在或者密码错误
在注册页面需要提交的数据有用户名，邮箱号，密码
返回的数据主要包括一个COOKIE
忘记密码页面需要提交的数据有邮箱号，验证码（通过邮箱获得验证码）

二，资源上传的页面
三，