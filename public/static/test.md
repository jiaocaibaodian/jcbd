<div class="post-body" itemprop="articleBody" style="opacity: 1; display: block; transform: translateY(0px);">
    <h2 id="问题描述与分析">
        <a href="#问题描述与分析" class="headerlink" title="问题描述与分析"></a>问题描述与分析</h2>
    <p>作为程序猿，应该多多少少都用过Markdown，或者至少读过别人用Markdown语法写的一些文档，比如在GitHub有一个你要用的开源程序，而你又是第一回用它，那么你一般会在这个仓库的Readme里读一读开发者提供的工具说明和使用的相关信息，这部分文档一般就是用Markdown的语法写的</p>
    <p><img src="/images/MarkDown2HTML-markdown-example.png" alt=""></p>
    <p align="center">此处以李恒大神的BWA的Readme为例</p>
    <p>简单来说，Markdown就是简化阉割过的HTML，优点是语法简单高效，缺点就是HTML中一些稍微高级复杂一点的效果，比如文本居中，Markdown就无法实现，所以Markdown一般被用来写对页面排版要求不高，以文字为主的笔记和文档</p>
    <p>如果你一开始用Markdown写了文档，想要把它放到你的网页上去，并以解析后的形式呈现</p>
    <p><img src="/images/MarkDown2HTML-transformation.png" alt=""></p>
    <p align="center">左边是原始Markdown文档，右边是解析后的网页效果</p>
    <p>那么你有两种实现途径：</p>
    <ul>
        <li>将Markdown文档以HTML形式导出，在网页上加载之前导出的HTML文件即可</li>
        <li>原始网页获取Markdown文档，用js将Markdown文本解析成HTML文本，动态修改原始网页对应标签节点的内容，就实现了Markdown文本的解析和展示</li>
    </ul>
    <p>第一种方法：</p>
    <blockquote>
        <p>技术难度最小，也很容易理解，但是操作起来比较繁琐：你的Markdown文档一般是要经常修改更新的，那么每修改一次，你就需要重新导出，然后将之前导出的那一版HTML替换掉</p>
    </blockquote>
    <p>第二种方法：</p>
    <blockquote>
        <ul>
            <li>技术难度上要高一些，但是目前已经有可以调用的JS框架来实现Markdown2HTML的解析</li>
            <li>最大的优点就是，每一次修改更新很方便，只需要对Markdown文档就可以了</li>
        </ul>
    </blockquote>
    <p>下面我们对<strong>第二种方法</strong>的实现过程进行详细的说明</p>
    <h2 id="用AJAX获取Markdown文档">
        <a href="#用AJAX获取Markdown文档" class="headerlink" title="用AJAX获取Markdown文档"></a>用AJAX获取Markdown文档</h2>
    <p>上一部分已经提到，我们需要先让原始网页请求服务器中的Markdown文档</p>
    <p>这一步需要使用AJAX（中文音译为阿甲克斯），这里先对AJAX作一个简单的科普：</p>
    <blockquote>
        <p>AJAX = Asynchronous JavaScript and XML（异步的 JavaScript 和 XML），AJAX 是一种用于创建快速动态网页的技术</p>
        <p>首先要说清楚什么是动态网页。与动态网页相对的是静态网页，也就是大家都知道的用HTML写的网页，这种网页的一个鲜明的特点就是它的内容一旦确定就无法改变，在互联网发展的最早期的时候大家用的都是这种静态网页。动态网页要求页面的内容能进行更新。那么怎么让原先的静态网页动起来成为动态网页呢？也有两种方法：</p>
        <ul>
            <li>重载整个网页面来更新页面内容</li>
            <li>上一个页面状态与下一个页面状态，它们之间有相同不变的部分，也有发生了改变的部分，那么我只需要把那些需要发生变化的部分进行修改就行了。这意味着可以在不重新加载整个网页的情况下，对网页的某部分进行更新</li>
        </ul>
        <p>第一种方法的不经济显而易见，不管各个页面节点前后是否发生了改变，统一都进行刷新</p>
        <p>AJAX就是采用第二种页面刷新方法：通过在后台与服务器进行少量数据交换，向服务器请求数据，解析请求的数据，然后对原页面需要刷新的部分进行刷新</p>
    </blockquote>
    <p><img src="/images/ajax-process.gif" alt=""></p>
    <p align="center">AJAX工作原理</p>
    <figure class="highlight plain">
        <div class="table-container">
            <table>
                <tbody>
                    <tr>
                        <td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br><span class="line">11</span><br><span class="line">12</span><br><span class="line">13</span><br><span class="line">14</span><br><span class="line">15</span><br><span class="line">16</span><br><span class="line">17</span><br><span class="line">18</span><br><span class="line">19</span><br><span class="line">20</span><br><span class="line">21</span><br><span class="line">22</span><br><span class="line">23</span><br><span class="line">24</span><br><span class="line">25</span><br><span class="line">26</span><br><span class="line">27</span><br><span class="line">28</span><br><span class="line">29</span><br><span class="line">30</span><br><span class="line">31</span><br></pre></td>
                        <td
                            class="code"><pre><span class="line">// 获取表单变量</span><br><span class="line">var f=form;</span><br><span class="line">// 创建XMLHttpRequest对象</span><br><span class="line">var xmlhttp;</span><br><span class="line">if (window.XMLHttpRequest)</span><br><span class="line">{</span><br><span class="line">	// IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码</span><br><span class="line">	xmlhttp=new XMLHttpRequest();</span><br><span class="line">}</span><br><span class="line">else</span><br><span class="line">{</span><br><span class="line">	// IE6, IE5 浏览器执行代码</span><br><span class="line">	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");</span><br><span class="line">}</span><br><span class="line"></span><br><span class="line"></span><br><span class="line">// 得到服务器响应后，对得到的Markdown文档进行解析</span><br><span class="line">xmlhttp.onreadystatechange=function()</span><br><span class="line">{</span><br><span class="line">	if (xmlhttp.readyState==4 &amp;&amp; xmlhttp.status==200)</span><br><span class="line">	{</span><br><span class="line">		// 这里调用了marked框架中的marked函数实现Markdown2HTML的解析</span><br><span class="line">		document.getElementById("content").innerHTML=marked(xmlhttp.responseText);</span><br><span class="line">	}</span><br><span class="line">}</span><br><span class="line"></span><br><span class="line"></span><br><span class="line">// 向服务器发送请求，获取你需要的Markdown文档</span><br><span class="line">xmlhttp.open("GET",f.q.value,true);</span><br><span class="line">xmlhttp.send();</span><br><span class="line">}</span><br></pre></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </figure>
    <p>对上面的脚本继续简单的说明：</p>
    <blockquote>
        <p>这个是AJAX的基本语法框架</p>
        <p>完成三步操作：</p>
        <ol>
            <li>创建http请求对象，告诉服务器我要哪个Markdown文档</li>
            <li>向服务器发起http请求</li>
            <li>收到服务器的反馈数据，得到请求的Markdown文档，进行数据的解析，实现Markdown2HTML</li>
        </ol>
    </blockquote>
    <p>那么这里有几个问题需要解答：</p>
    <p><strong>1. 怎么指定我想要的Markdown文档呢？</strong></p>
    <blockquote>
        <p>看上面的代码部分的最后一小部分，有这样一行命令：</p>
        <figure class="highlight plain">
            <div class="table-container">
                <table>
                    <tbody>
                        <tr>
                            <td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br></pre></td>
                            <td class="code"><pre><span class="line">&gt; xmlhttp.open("GET",f.q.value,true);</span><br><span class="line">&gt;</span><br></pre></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </figure>
    </blockquote>
    <blockquote>
        <p>这个函数的第二个参数<code>f.q.value</code>，指定了你要的Markdown文档的地址，所以如果想要指定Markdown文档就需要对这个变量进行设定</p>
        <p>怎么设定这个变量？</p>
        <p>用表单传参来实现，这里的f就是表单变量，表单部分怎么实现请点 <a href="#specify-markdown-doc">这里</a></p>
    </blockquote>
    <h2 id="用表单指定Markdown文档">
        <a href="#用表单指定Markdown文档" class="headerlink" title="用表单指定Markdown文档"></a>用表单指定Markdown文档</h2>
    <figure class="highlight plain">
        <div class="table-container">
            <table>
                <tbody>
                    <tr>
                        <td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br></pre></td>
                        <td
                            class="code"><pre><span class="line">&lt;form name="form" action="" method="post"&gt;</span><br><span class="line">	&lt;select name="q"&gt;</span><br><span class="line">		&lt;option class="active" alue=""&gt;选择一个笔记:&lt;/option&gt;</span><br><span class="line">		&lt;option value="A.md"&gt;第一个Markdown文档&lt;/option&gt;</span><br><span class="line">		&lt;option value="B.md"&gt;第二个Markdown文档&lt;/option&gt;</span><br><span class="line">		&lt;option value="C.md"&gt;第三个Markdown文档&lt;/option&gt;</span><br><span class="line">		&lt;option value="Evalue-TranscriptomeData.md"&gt;第四个Markdown文档&lt;/option&gt;</span><br><span class="line">	&lt;/select&gt;</span><br><span class="line">	&lt;input type="button" value="显示" onclick="showMarkdown()"&gt;</span><br><span class="line">&lt;/form&gt;</span><br></pre></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </figure>
    <p>表单的显示效果如下：</p>
    <p><img src="/images/MarkDown2HTML-form.png" alt=""></p>
    <p>点击表单中的“显示”按钮后会执行<code>showMarkdown( )</code>函数，即 <a href="#get-markdown-doc">用AJAX获取Markdown文档</a> 部分的那个函数，并且将表单选择的信息通过<code>form</code>变量传递给了<code>showMarkdown( )</code>函数中的<code>f</code>变量</p>
    <p>这样就通过表单设定了用户指定的Markdown文档</p>
    <h2 id="引用marked框架解析Markdown文档">
        <a href="#引用marked框架解析Markdown文档" class="headerlink" title="引用marked框架解析Markdown文档"></a>引用marked框架解析Markdown文档</h2>
    <p>这里采用的是GitHub上的名为<code>marked</code>的JS框架，链接：<code>https://github.com/markedjs/marked</code></p>
    <p>要想使用这个框架，需要在html脚本的头信息中引用这个框架：</p>
    <figure class="highlight plain">
        <div class="table-container">
            <table>
                <tbody>
                    <tr>
                        <td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br></pre></td>
                        <td
                            class="code"><pre><span class="line">&lt;html&gt;</span><br><span class="line">&lt;head&gt;</span><br><span class="line">	...</span><br><span class="line">	&lt;script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"&gt;&lt;/script&gt;</span><br><span class="line">	...</span><br><span class="line">&lt;/head&gt;</span><br><span class="line">.</span><br><span class="line">.</span><br><span class="line">.</span><br></pre></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </figure>
    <p>引用这个框架后就可以使用里面定义的<code>marked( )</code>函数进行Markdown文本解析了</p>
    <h2 id="附：完整的实现脚本">
        <a href="#附：完整的实现脚本" class="headerlink" title="附：完整的实现脚本"></a>附：完整的实现脚本</h2>
    <figure class="highlight plain">
        <div class="table-container">
            <table>
                <tbody>
                    <tr>
                        <td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br><span class="line">9</span><br><span class="line">10</span><br><span class="line">11</span><br><span class="line">12</span><br><span class="line">13</span><br><span class="line">14</span><br><span class="line">15</span><br><span class="line">16</span><br><span class="line">17</span><br><span class="line">18</span><br><span class="line">19</span><br><span class="line">20</span><br><span class="line">21</span><br><span class="line">22</span><br><span class="line">23</span><br><span class="line">24</span><br><span class="line">25</span><br><span class="line">26</span><br><span class="line">27</span><br><span class="line">28</span><br><span class="line">29</span><br><span class="line">30</span><br><span class="line">31</span><br><span class="line">32</span><br><span class="line">33</span><br><span class="line">34</span><br><span class="line">35</span><br><span class="line">36</span><br><span class="line">37</span><br><span class="line">38</span><br><span class="line">39</span><br><span class="line">40</span><br><span class="line">41</span><br><span class="line">42</span><br><span class="line">43</span><br><span class="line">44</span><br><span class="line">45</span><br><span class="line">46</span><br><span class="line">47</span><br><span class="line">48</span><br><span class="line">49</span><br><span class="line">50</span><br><span class="line">51</span><br><span class="line">52</span><br><span class="line">53</span><br><span class="line">54</span><br><span class="line">55</span><br><span class="line">56</span><br><span class="line">57</span><br><span class="line">58</span><br><span class="line">59</span><br><span class="line">60</span><br><span class="line">61</span><br><span class="line">62</span><br><span class="line">63</span><br><span class="line">64</span><br><span class="line">65</span><br><span class="line">66</span><br><span class="line">67</span><br><span class="line">68</span><br><span class="line">69</span><br><span class="line">70</span><br><span class="line">71</span><br><span class="line">72</span><br><span class="line">73</span><br><span class="line">74</span><br><span class="line">75</span><br><span class="line">76</span><br><span class="line">77</span><br><span class="line">78</span><br><span class="line">79</span><br></pre></td>
                        <td
                            class="code"><pre><span class="line">&lt;!DOCTYPE html&gt;</span><br><span class="line">&lt;html&gt;</span><br><span class="line">&lt;head&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	// 在这里对marked框架进行引用</span><br><span class="line">	&lt;script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"&gt;&lt;/script&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	// 在这里编写AJAX代码</span><br><span class="line">	&lt;script&gt;</span><br><span class="line">  function showMarkdown()</span><br><span class="line">{</span><br><span class="line">	// 获取表单变量</span><br><span class="line">	var f=form;</span><br><span class="line">	// 创建XMLHttpRequest对象</span><br><span class="line">	var xmlhttp;</span><br><span class="line">	if (window.XMLHttpRequest)</span><br><span class="line">	{</span><br><span class="line">		// IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码</span><br><span class="line">		xmlhttp=new XMLHttpRequest();</span><br><span class="line">	}</span><br><span class="line">	else</span><br><span class="line">	{</span><br><span class="line">		// IE6, IE5 浏览器执行代码</span><br><span class="line">		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");</span><br><span class="line">	}</span><br><span class="line">	</span><br><span class="line">	</span><br><span class="line">	// 得到服务器响应后，对得到的Markdown文档进行解析</span><br><span class="line">	xmlhttp.onreadystatechange=function()</span><br><span class="line">	{</span><br><span class="line">		if (xmlhttp.readyState==4 &amp;&amp; xmlhttp.status==200)</span><br><span class="line">		{</span><br><span class="line">			// 这里调用了marked框架中的marked函数实现Markdown2HTML的解析</span><br><span class="line">			document.getElementById("content").innerHTML=marked(xmlhttp.responseText);</span><br><span class="line">		}</span><br><span class="line">	}</span><br><span class="line">	</span><br><span class="line">	</span><br><span class="line">	// 向服务器发送请求，获取你需要的Markdown文档</span><br><span class="line">	xmlhttp.open("GET",f.q.value,true);</span><br><span class="line">	xmlhttp.send();</span><br><span class="line">	}</span><br><span class="line">}</span><br><span class="line">	&lt;/script&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">&lt;/head&gt;</span><br><span class="line">&lt;body&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	// 在这里编辑表单代码</span><br><span class="line">	&lt;div class="container" style="margin-top:30px"&gt;</span><br><span class="line">		&lt;form name="form" action="" method="post"&gt;</span><br><span class="line">			&lt;select name="q"&gt;</span><br><span class="line">				&lt;option class="active" alue=""&gt;选择一个笔记:&lt;/option&gt;</span><br><span class="line">				&lt;option value="A.md"&gt;第一个Markdown文档&lt;/option&gt;</span><br><span class="line">				&lt;option value="B.md"&gt;第二个Markdown文档&lt;/option&gt;</span><br><span class="line">				&lt;option value="C.md"&gt;第三个Markdown文档&lt;/option&gt;</span><br><span class="line">				&lt;option value="Evalue-TranscriptomeData.md"&gt;第四个Markdown文档&lt;/option&gt;</span><br><span class="line">			&lt;/select&gt;</span><br><span class="line">			&lt;input type="button" value="显示" onclick="showMarkdown()"&gt;</span><br><span class="line">		&lt;/form&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	// 在这里编辑空的div节点，用于后面展示解析后的内容</span><br><span class="line">	&lt;div id="content"&gt;&lt;/div&gt;</span><br><span class="line">	&lt;/div&gt;</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">	.</span><br><span class="line">&lt;/body&gt;</span><br><span class="line">&lt;/html&gt;</span><br></pre></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </figure>
    <hr>
    <p>参考资料：</p>
    <p>(1) <a href="https://github.com/Ming-Lian/Setup-Database/blob/master/AJAX%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0.md#content" target="_blank" rel="noopener">本人github笔记：AJAX学习笔记</a></p>
    <p>(2) <a href="https://github.com/markedjs/marked" target="_blank" rel="noopener">marked说明文档</a></p>
</div>