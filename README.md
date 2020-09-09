<div class="post">
            <h1 class="postTitle">
                
<a id="cb_post_title_url" class="postTitle2 vertical-middle" href="https://www.cnblogs.com/niejunlei/p/13613783.html">
    <span>服务治理之重试篇</span>
    


</a>

            </h1>
            <div class="clear"></div>
            <div class="postBody">
                
<div id="cnblogs_post_body" class="blogpost-body">
    <h2 id="UCAPI重试-一、背景">一、背景</h2>
<p>什么是重试？</p>
<p>一种保障机制，why not try again！</p>
<p>无论是单体服务模块化的调用，或是微服务当道的今天服务间的相互调用。一次业务请求包含了太多的链条环扣，每一扣的失败都会导致整个请求的失败。因此需要保障每个环节的可用性。</p>
<h2 id="UCAPI重试-2、动态策略配置">二、动态策略配置</h2>
<h3>1、基本配置项</h3>
<p>涉及重试，我们所需要关心的几点基本包括：什么时候重试？重试多少次？每次重试的间隔？</p>
<p>也即：重试异常、最大重试次数、重试间隔。</p>
<p><strong>1）重试异常：</strong></p>
<p>其实拿重试异常作为“什么时候重试?”的结论也不太完整。异常是一个通常的触发点，比如发生rpc超时了，此时需要触发重试机制以再次请求获取结果。但是有时，我们也会关注返回结果是否符合预期，比如，我们去请求某个状态，但是返回的和我们预期的不符（通常发成此种情况，一方面可能是数据层面的一致性问题，或者服务层面，服务提供方存在异常处理或者降级策略等），我们就需要去再次尝试获取。此处对于此类不再展开讨论。</p>
<p><strong>2）最大重试次数：</strong></p>
<p>最大，我们知道这是一个上限控制，重试也需要有终止条件（类似递归的终止），无论你的重试切入点是在入口，或者下游的某个链条，我们需要明确的是整个服务的【基本响应时间】要求必须得到保障。</p>
<p>重试是需要消耗额外时间的，包括每次的间隔及重试请求的耗时，因此必须综合考量配置。</p>
<p><strong>3）重试间隔：</strong></p>
<p>上面一点，我们已经提到重视间隔时间的概念，即，每次重试请求之间的间隔。</p>
<p>为什么会需要这个间隔呢？直接连续重试不行吗？其实，也是可以的，但是可能不合理。</p>
<p>间隔的存在涉及分散服务压力的需要，把请求平摊到更长的时间段内，减小下游服务的压力，比如我们在第一点中提到的，如果是因为下游服务触发降级导致的非预期结果重试，那么提供必要的间隔时间以供下游服务恢复服务能力则是必须的。</p>
<p>当然，重试间隔也可以有多种策略，比如每次在一个数值范围内随机间隔时间、逐渐递增间隔时间或者只是简单地固定长度间隔时间，可以根据实际的业务情景进行定制化的处理。</p>
<h3>2、配置中心选择</h3>
<p>其实此处，我们只是需要一种机制，即，配置的存储和配置变更的及时发现。任何实现都是可以的。</p>
<p>成熟的配置中心如 spring-cloud-config、apollo、nacos 等。或者基于 zookeeper、redis等，加上自己实现监听。</p>
<p>此处，我们简单介绍基于apollo配置中心。</p>
<p>详细可以参考：<a href="https://www.cnblogs.com/niejunlei/p/12502020.html" target="_blank">Apollo（阿波罗）配置中心Java客户端使用指南使用指南</a></p>
<p>如下，基于注解配置相应的监听 Listner，监听重试策略配置key变动</p>
<p><img src="https://img2020.cnblogs.com/blog/603942/202009/603942-20200904125621976-935477079.png" alt="" width="440" height="176" loading="lazy"></p>
<p><img src="https://img2020.cnblogs.com/blog/603942/202009/603942-20200904133445488-1176557973.png" alt="" width="798" height="206" loading="lazy"></p>
<p>interestedKeys 需要监听的配置key。</p>
<h3>3、配置</h3>
<p>如下针对不同策略，添加不同的配置，以 name 区分：</p>
<blockquote>
<pre class="modal-body no-radius ng-binding">[
    {
        "name": "ht", //策略名称
        "max": 2, //最大重试次数
        "dur": 200, //重试间隔
        "ex": "xxx.XXXException" //需要重试的异常
    }
]</pre>
</blockquote>
<h3>4、策略创建</h3>
<p>策略的创建时机主要分为两部分，</p>
<p>一是服务启动时的初始化，此时需要拉取配置中心的配置进行写略的初始创建存储；</p>
<p>二是配置变更，监听获取到配置变化时对策略的重新初始化创建替换。</p>
<h2 id="UCAPI重试-二、重试">三、重试框架</h2>
<p>目前流行的的包含或者专于重试实现的框架可能比较多，限于认知，仅就如下调研的几个做简要入门介绍：</p>
<h3>1、<strong>guava-retrying</strong></h3>
<p>docs：<a class="external-link" href="https://github.com/rholder/guava-retrying" rel="nofollow">https://github.com/rholder/guava-retrying</a></p>
<p>guava-retrying是基于Guava核心库的。</p>
<p>基本组成部分如下图：</p>
<p><img src="https://img2020.cnblogs.com/blog/603942/202009/603942-20200904134500338-335412489.png" alt="" width="360" height="374" loading="lazy"></p>
<p>Retryer：重试的入口和实际执行者。</p>
<p>StopStrategy：重试终止策略，也即什么时候停止重试。</p>
<p>WaitStrategy：间隔策略，确定每次重试间隔时间。</p>
<p>Attempt：代表每次重试请求，记录请求数据及结果。</p>
<p><strong>基本依赖：</strong></p>
<div class="cnblogs_code">
<pre>&lt;dependency&gt;
    &lt;groupId&gt;com.github.rholder&lt;/groupId&gt;
    &lt;artifactId&gt;guava-retrying&lt;/artifactId&gt;
    &lt;version&gt;{version}&lt;/version&gt;
&lt;/dependency&gt;</pre>
</div>
<p><strong>完整的重试配置如下：</strong></p>
<p>基于内存存储不同策略的重试器&nbsp;RETRYERS</p>
<div class="cnblogs_code"><div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div>
<pre><span style="color: #008000;">/**</span><span style="color: #008000;">
 * dynamic retry config
 </span><span style="color: #008000;">*/</span><span style="color: #000000;">
@Slf4j
@Configuration
</span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">class</span><span style="color: #000000;"> MyRetryConfig {

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry apollo config</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">final</span> String RETRY_RULES_CONFIG = "retry_rules"<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration min 100 ms</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">long</span> RETRY_DURATION_MIN = 100<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration max 500 ms</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">long</span> RETRY_DURATION_MAX = 500<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry min attempts 1</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MIN = 1<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry max attempts 3</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MAX = 3<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry default config</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> String RETRY_DEFAULT_KEY = "default"<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry default</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> Retryer RETRY_DEFAULT =<span style="color: #000000;"> RetryerBuilder.newBuilder()
            .withWaitStrategy(WaitStrategies.fixedWait(RETRY_DURATION_MIN, TimeUnit.MILLISECONDS)) </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration</span>
            .withStopStrategy(StopStrategies.stopAfterAttempt(RETRY_ATTEMPTS_MAX)) <span style="color: #008000;">//</span><span style="color: #008000;">max retry times</span>
<span style="color: #000000;">            .build();

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retryer</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> Map&lt;String, Retryer&gt; RETRYERS = <span style="color: #0000ff;">new</span> HashMap&lt;&gt;<span style="color: #000000;">();

    @PostConstruct
    </span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> init() {
        String retryConfig </span>=<span style="color: #000000;"> ApolloConfig.getValue(RETRY_RULES_CONFIG,  StringUtils.EMPTY);
        </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
            RETRYERS.clear();
            MyRetry[] config </span>= Optional.ofNullable(JJsonUtil.jsonToBeanArray(retryConfig, MyRetry[].<span style="color: #0000ff;">class</span>)).orElse(<span style="color: #0000ff;">new</span> MyRetry[0<span style="color: #000000;">]);
            </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (MyRetry myRetry : config) {
                RETRYERS.put(myRetry.getName(), buildRetryer(myRetry));
            }
            log.info(</span>"retry config init, config: {}"<span style="color: #000000;">, retryConfig);
        } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (IOException e) {
            log.warn(</span>"init retry config failed"<span style="color: #000000;">);
        }
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * apollo retry config listener
     *
     * listening key: RETRY_RULES_CONFIG
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> changeEvent
     </span><span style="color: #008000;">*/</span><span style="color: #000000;">
    @ApolloConfigChangeListener(interestedKeys </span>=<span style="color: #000000;"> {RETRY_RULES_CONFIG})
    </span><span style="color: #0000ff;">private</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> apolloConfigChangeEvent(ConfigChangeEvent changeEvent) {
        log.info(</span>"retry config changed, reconfig retry: {}"<span style="color: #000000;">, changeEvent.getChange(RETRY_RULES_CONFIG));
        init();
    }


    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * config and build retryer
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> myRetry
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span><span style="color: #000000;"> Retryer buildRetryer(MyRetry myRetry) {
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable max</span>
        <span style="color: #0000ff;">int</span> max =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getMax(), RETRY_ATTEMPTS_MIN, RETRY_ATTEMPTS_MAX);
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable duration</span>
        <span style="color: #0000ff;">long</span> duration =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getDur(), RETRY_DURATION_MIN, RETRY_DURATION_MAX);
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> buildRetryer(max, duration, parseRetryConfigEx(myRetry.getEx()), myRetry.getName());
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * retry trace exceptions config =&gt; Class
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> config
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span> Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] parseRetryConfigEx(String config) {
        String [] exs </span>= Optional.ofNullable(StringUtils.split(config, "|"<span style="color: #000000;">)).orElse(ArrayUtils.EMPTY_STRING_ARRAY);
        List</span>&lt;Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;&gt; exClazz = <span style="color: #0000ff;">new</span> ArrayList&lt;&gt;<span style="color: #000000;">();
        </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (String ex : exs) {
            </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
                exClazz.add((Class</span>&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">) Class.forName(ex));
            } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (ClassNotFoundException e) {
                log.warn(</span>"parse retry ex config failed, config: {}, e: {}"<span style="color: #000000;">, ex, e.getMessage());
            }
        }

        </span><span style="color: #0000ff;">return</span> exClazz.toArray(<span style="color: #0000ff;">new</span> Class[0<span style="color: #000000;">]);
    }


    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * config and build retryer
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> maxAttempts
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> duration
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> errorClasses
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">public</span> Retryer buildRetryer(<span style="color: #0000ff;">int</span> maxAttempts, <span style="color: #0000ff;">long</span> duration, Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] errorClasses, String name) {
        RetryerBuilder builder </span>=<span style="color: #000000;"> RetryerBuilder.newBuilder()
                .withWaitStrategy(WaitStrategies.fixedWait(duration, TimeUnit.MILLISECONDS)) </span><span style="color: #008000;">//</span><span style="color: #008000;">retry dueation</span>
                .withStopStrategy(StopStrategies.stopAfterAttempt(maxAttempts)); <span style="color: #008000;">//</span><span style="color: #008000;">max retry times

        </span><span style="color: #008000;">//</span><span style="color: #008000;">trace exceptions</span>
        <span style="color: #0000ff;">for</span> (Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;"> errorClass : errorClasses) {
            builder.retryIfExceptionOfType(errorClass);
        }

        </span><span style="color: #008000;">//</span><span style="color: #008000;">retry listener</span>
        builder.withRetryListener(<span style="color: #0000ff;">new</span><span style="color: #000000;"> RetryListener() {
            @Override
            </span><span style="color: #0000ff;">public</span> &lt;V&gt; <span style="color: #0000ff;">void</span> onRetry(Attempt&lt;V&gt;<span style="color: #000000;"> attempt) {</span><span style="color: #000000;">
                log.info(</span>"retry attempt, times: {}, duration: {}"<span style="color: #000000;">, attempt.getAttemptNumber(), attempt.getDelaySinceFirstAttempt());
            }
        });

        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> builder.build();
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * get or default
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> retryer
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span><span style="color: #000000;"> Retryer getRetryer(String retryer) {
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> RETRYERS.getOrDefault(StringUtils.defaultIfEmpty(retryer, RETRY_DEFAULT_KEY), RETRY_DEFAULT);
    }
}</span></pre>
<div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div></div>
<p><strong>重试工具类：</strong></p>
<p>基于默认策略或者指定策略的重试包装调用：</p>
<div class="cnblogs_code"><div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div>
<pre><span style="color: #000000;">@Slf4j
</span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">class</span><span style="color: #000000;"> RetryUtils {

    </span><span style="color: #0000ff;">private</span><span style="color: #000000;"> RetryUtils(){}

    </span><span style="color: #008000;">//</span><span style="color: #008000;">default retry</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span> &lt;T&gt; T callWithRetry(Callable&lt;T&gt; callable) <span style="color: #0000ff;">throws</span><span style="color: #000000;"> Exception {
        </span><span style="color: #0000ff;">return</span> callWithRetry(<span style="color: #0000ff;">null</span><span style="color: #000000;">, callable);
    }

    </span><span style="color: #008000;">//</span><span style="color: #008000;">custom retry</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span> &lt;T&gt; T callWithRetry(String retryer, Callable&lt;T&gt; callable) <span style="color: #0000ff;">throws</span><span style="color: #000000;"> Exception {
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> (T) MyRetryConfig.getRetryer(retryer).call(callable);
    }
}</span></pre>
<div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div></div>
<p><strong>调用：</strong></p>
<div class="cnblogs_code">
<pre>List&lt;Object&gt; list = RetryUtils.callWithRetry(() -&gt; xxxService.getXXXs(args));&nbsp;</pre>
</div>
<h3>2、<strong>spring-retry</strong></h3>
<p>docs：<a class="external-link" href="https://github.com/spring-projects/spring-retry" rel="nofollow">https://github.com/spring-projects/spring-retry</a></p>
<p>spring-retry 我们基于 RetryTemplate，使用方式和 guava-retrying 类似。spring-retry 支持基于注解的方式，此处不再展开讨论。</p>
<p><strong>基本依赖：</strong></p>
<div class="cnblogs_code">
<pre>        &lt;dependency&gt;
            &lt;groupId&gt;org.springframework.retry&lt;/groupId&gt;
            &lt;artifactId&gt;spring-retry&lt;/artifactId&gt;
            &lt;version&gt;{version}&lt;/version&gt;
        &lt;/dependency&gt;</pre>
</div>
<p><strong>完整的配置：</strong></p>
<div class="cnblogs_code"><div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div>
<pre><span style="color: #008000;">/**</span><span style="color: #008000;">
 * dynamic retry config
 </span><span style="color: #008000;">*/</span><span style="color: #000000;">
@Slf4j
@Configuration
</span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">class</span><span style="color: #000000;"> MyRetryConfig {

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry apollo config</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">final</span> String RETRY_RULES_CONFIG = "retry_rules"<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration min 100 ms</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">long</span> RETRY_DURATION_MIN = 100<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration max 500 ms</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">long</span> RETRY_DURATION_MAX = 500<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry min attempts 1</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MIN = 1<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry max attempts 3</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MAX = 3<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry default config</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> String RETRY_DEFAULT_KEY = "default"<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry default</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> RetryTemplate RETRY_DEFAULT =<span style="color: #000000;"> RetryTemplate.builder()
            .fixedBackoff(RETRY_DURATION_MIN) </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration</span>
            .maxAttempts(RETRY_ATTEMPTS_MAX) <span style="color: #008000;">//</span><span style="color: #008000;">max retry times</span>
<span style="color: #000000;">            .build();

    </span><span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> Map&lt;String, RetryTemplate&gt; RETRYERS = <span style="color: #0000ff;">new</span> HashMap&lt;&gt;<span style="color: #000000;">();

    @PostConstruct
    </span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> init() {
        String retryConfig </span>=<span style="color: #000000;"> ApolloConfig.getValue(RETRY_RULES_CONFIG,  StringUtils.EMPTY);
        </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
            RETRYERS.clear();
            MyRetry[] config </span>= Optional.ofNullable(JJsonUtil.jsonToBeanArray(retryConfig, MyRetry[].<span style="color: #0000ff;">class</span>)).orElse(<span style="color: #0000ff;">new</span> MyRetry[0<span style="color: #000000;">]);
            </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (MyRetry myRetry : config) {
                RETRYERS.put(myRetry.getName(), buildRetryTemplate(myRetry));
            }
            log.info(</span>"retry config init, config: {}"<span style="color: #000000;">, retryConfig);
        } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (IOException e) {
            log.warn(</span>"init retry config failed"<span style="color: #000000;">);
        }
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * apollo retry config listener
     *
     * listening key: RETRY_RULES_CONFIG
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> changeEvent
     </span><span style="color: #008000;">*/</span><span style="color: #000000;">
    @ApolloConfigChangeListener(interestedKeys </span>=<span style="color: #000000;"> {RETRY_RULES_CONFIG})
    </span><span style="color: #0000ff;">private</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> apolloConfigChangeEvent(ConfigChangeEvent changeEvent) {
        log.info(</span>"retry config changed, reconfig retry: {}"<span style="color: #000000;">, changeEvent.getChange(RETRY_RULES_CONFIG));
        init();
    }


    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * config and build retryTemplate
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> myRetry
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span><span style="color: #000000;"> RetryTemplate buildRetryTemplate(MyRetry myRetry) {
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable max</span>
        <span style="color: #0000ff;">int</span> max =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getMax(), RETRY_ATTEMPTS_MIN, RETRY_ATTEMPTS_MAX);
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable duration</span>
        <span style="color: #0000ff;">long</span> duration =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getDur(), RETRY_DURATION_MIN, RETRY_DURATION_MAX);
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> buildRetryTemplate(max, duration, parseRetryConfigEx(myRetry.getEx()), myRetry.getName());
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * retry trace exceptions config =&gt; Class
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> config
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span> Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] parseRetryConfigEx(String config) {
        String [] exs </span>= Optional.ofNullable(StringUtils.split(config, "|"<span style="color: #000000;">)).orElse(ArrayUtils.EMPTY_STRING_ARRAY);
        List</span>&lt;Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;&gt; exClazz = <span style="color: #0000ff;">new</span> ArrayList&lt;&gt;<span style="color: #000000;">();
        </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (String ex : exs) {
            </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
                exClazz.add((Class</span>&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">) Class.forName(ex));
            } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (ClassNotFoundException e) {
                log.warn(</span>"parse retry ex config failed, config: {}, e: {}"<span style="color: #000000;">, ex, e.getMessage());
            }
        }

        </span><span style="color: #0000ff;">return</span> exClazz.toArray(<span style="color: #0000ff;">new</span> Class[0<span style="color: #000000;">]);
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * config and build retryTemplate
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> maxAttempts
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> duration
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> errorClasses
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">public</span> RetryTemplate buildRetryTemplate(<span style="color: #0000ff;">int</span> maxAttempts, <span style="color: #0000ff;">long</span> duration, Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] errorClasses, String name) {
        RetryTemplateBuilder builder </span>=<span style="color: #000000;"> RetryTemplate.builder()
                .maxAttempts(maxAttempts) </span><span style="color: #008000;">//</span><span style="color: #008000;">max retry times</span>
                .fixedBackoff(duration);  <span style="color: #008000;">//</span><span style="color: #008000;">retry dueation

        </span><span style="color: #008000;">//</span><span style="color: #008000;">trace exceptions</span>
        <span style="color: #0000ff;">for</span> (Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;"> errorClass : errorClasses) {
            builder.retryOn(errorClass);
        }

        </span><span style="color: #008000;">//</span><span style="color: #008000;">retry listener</span>
        builder.withListener(<span style="color: #0000ff;">new</span><span style="color: #000000;"> RetryListenerSupport(){
            @Override
            </span><span style="color: #0000ff;">public</span> &lt;T, E <span style="color: #0000ff;">extends</span> Throwable&gt; <span style="color: #0000ff;">void</span> onError(RetryContext context, RetryCallback&lt;T, E&gt;<span style="color: #000000;"> callback, Throwable throwable) {
                log.info(</span>"retry: {}"<span style="color: #000000;">, context);
            }
        });

        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> builder.build();
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * get or default
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> retryTemplate
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span><span style="color: #000000;"> RetryTemplate getRetryTemplate(String retryTemplate) {
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> RETRYERS.getOrDefault(StringUtils.defaultIfEmpty(retryTemplate, RETRY_DEFAULT_KEY), RETRY_DEFAULT);
    }
}</span></pre>
<div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div></div>
<p><strong>重试工具类：</strong></p>
<div class="cnblogs_code"><div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div>
<pre><span style="color: #000000;">@Slf4j
</span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">class</span><span style="color: #000000;"> RetryUtils {

    </span><span style="color: #0000ff;">private</span><span style="color: #000000;"> RetryUtils(){}

    </span><span style="color: #008000;">//</span><span style="color: #008000;">default retry</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span> &lt;T&gt; T callWithRetry(RetryCallback&lt;T, Exception&gt; callback) <span style="color: #0000ff;">throws</span><span style="color: #000000;"> Exception {
        </span><span style="color: #0000ff;">return</span> callWithRetry(<span style="color: #0000ff;">null</span><span style="color: #000000;">, callback);
    }

    </span><span style="color: #008000;">//</span><span style="color: #008000;">custom retry</span>
    <span style="color: #0000ff;">public</span> <span style="color: #0000ff;">static</span> &lt;T&gt; T callWithRetry(String retryer, RetryCallback&lt;T, Exception&gt; callback) <span style="color: #0000ff;">throws</span><span style="color: #000000;"> Exception {
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> (T) MyRetryConfig.getRetryTemplate(retryer).execute(callback);
    }
}</span></pre>
<div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div></div>
<p><strong>调用：</strong></p>
<div class="cnblogs_code">
<pre>        List&lt;Object&gt; list = RetryUtils.callWithRetry(context -&gt; xxxService.getXXXs(args));</pre>
</div>
<h3>3、resilience4j-retry</h3>
<p>Resilience4j 是一个轻量级的容错框架，提供包括熔断降级，流控及重试等功能。</p>
<p>详细参考文档：<a class="external-link" href="https://resilience4j.readme.io/docs/retry" rel="nofollow">https://resilience4j.readme.io/docs/retry</a></p>
<p><strong>基本依赖：</strong></p>
<div class="cnblogs_code">
<pre>&lt;dependency&gt;
    &lt;groupId&gt;io.github.resilience4j&lt;/groupId&gt;
    &lt;artifactId&gt;resilience4j-retry&lt;/artifactId&gt;
    &lt;version&gt;{version}&lt;/version&gt;
&lt;/dependency&gt;</pre>
</div>
<p><strong>完整配置：</strong></p>
<p>此处使用 RetryRegistry 作为策略注册管理中心。</p>
<div class="cnblogs_code"><div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div>
<pre><span style="color: #008000;">/**</span><span style="color: #008000;">
 * Resilience4j config
 </span><span style="color: #008000;">*/</span><span style="color: #000000;">
@Slf4j
@Configuration
</span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">class</span><span style="color: #000000;"> MyRetryConfig {

    </span><span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">final</span> String RETRY_RULES_CONFIG = "retry_rules"<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry duration min 100 ms</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">long</span> RETRY_DURATION_MIN = 100<span style="color: #000000;">;

    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry min attempts 1</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MIN = 1<span style="color: #000000;">;
    </span><span style="color: #008000;">//</span><span style="color: #008000;">retry max attempts 3</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">static</span> <span style="color: #0000ff;">int</span> RETRY_ATTEMPTS_MAX = 3<span style="color: #000000;">;

    @Resource
    </span><span style="color: #0000ff;">private</span><span style="color: #000000;"> RetryRegistry retryRegistry;


    @PostConstruct
    </span><span style="color: #0000ff;">public</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> init() {
        initRetry(</span><span style="color: #0000ff;">false</span><span style="color: #000000;">);
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * init retry
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> reInit config change reinit
     </span><span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span> <span style="color: #0000ff;">void</span> initRetry(<span style="color: #0000ff;">boolean</span><span style="color: #000000;"> reInit) {
        String retryConfig </span>=<span style="color: #000000;"> ApolloConfig.getValue(RETRY_RULES_CONFIG,  StringUtils.EMPTY);
        </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
            MyRetry[] config </span>= Optional.ofNullable(JJsonUtil.jsonToBeanArray(retryConfig, MyRetry[].<span style="color: #0000ff;">class</span>)).orElse(<span style="color: #0000ff;">new</span> MyRetry[0<span style="color: #000000;">]);
            </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (MyRetry myRetry : config) {
                </span><span style="color: #0000ff;">if</span><span style="color: #000000;"> (reInit) {
                    retryRegistry.replace(myRetry.getName(), Retry.of(myRetry.getName(), parseRetryConfig(myRetry)));
                } </span><span style="color: #0000ff;">else</span><span style="color: #000000;"> {
                    retryRegistry.retry(myRetry.getName(), parseRetryConfig(myRetry));
                }
            }
            log.info(</span>"r4jConfigEvent, init retry: {}"<span style="color: #000000;">, retryConfig);
        } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (IOException e) {
            log.warn(</span>"init retry config failed"<span style="color: #000000;">);
        }
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * apollo retry config listener
     *
     * listening key: RETRY_RULES_CONFIG
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> changeEvent
     </span><span style="color: #008000;">*/</span><span style="color: #000000;">
    @DependsOn(value </span>= "retryRegistry"<span style="color: #000000;">)
    @ApolloConfigChangeListener(interestedKeys </span>=<span style="color: #000000;"> {RETRY_RULES_CONFIG})
    </span><span style="color: #0000ff;">private</span> <span style="color: #0000ff;">void</span><span style="color: #000000;"> apolloConfigChangeEvent(ConfigChangeEvent changeEvent) {
        log.info(</span>"retry config changed, reconfig retry: {}"<span style="color: #000000;">, changeEvent.getChange(RETRY_RULES_CONFIG));
        initRetry(</span><span style="color: #0000ff;">true</span><span style="color: #000000;">);
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * retry config =&gt; RetryConfig
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> myRetry
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span><span style="color: #000000;"> RetryConfig parseRetryConfig(MyRetry myRetry) {
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable max</span>
        <span style="color: #0000ff;">int</span> max =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getMax(), RETRY_ATTEMPTS_MIN, RETRY_ATTEMPTS_MAX);
        </span><span style="color: #008000;">//</span><span style="color: #008000;">suitable duration</span>
        <span style="color: #0000ff;">long</span> duration =<span style="color: #000000;"> NumUtils.getLimitedNumber(myRetry.getDur(), RETRY_DURATION_MIN, RetryConfig.DEFAULT_WAIT_DURATION);
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> configRetryConfig(max, duration, parseRetryConfigEx(myRetry.getEx()));
    }

    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * retry exception config =&gt; Class
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> config
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">private</span> Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] parseRetryConfigEx(String config) {
        String [] exs </span>= Optional.ofNullable(StringUtils.split(config, "|"<span style="color: #000000;">)).orElse(ArrayUtils.EMPTY_STRING_ARRAY);
        List</span>&lt;Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;&gt; exClazz = <span style="color: #0000ff;">new</span> ArrayList&lt;&gt;<span style="color: #000000;">();
        </span><span style="color: #0000ff;">for</span><span style="color: #000000;"> (String ex : exs) {
            </span><span style="color: #0000ff;">try</span><span style="color: #000000;"> {
                exClazz.add((Class</span>&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">) Class.forName(ex));
            } </span><span style="color: #0000ff;">catch</span><span style="color: #000000;"> (ClassNotFoundException e) {
                log.warn(</span>"parse retry ex config failed, config: {}, e: {}"<span style="color: #000000;">, ex, e.getMessage());
            }
        }

        </span><span style="color: #0000ff;">return</span> exClazz.isEmpty() ? <span style="color: #0000ff;">null</span> : exClazz.toArray(<span style="color: #0000ff;">new</span> Class[0<span style="color: #000000;">]);
    }


    </span><span style="color: #008000;">/**</span><span style="color: #008000;">
     * process retry config
     *
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> maxAttempts
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> duration
     * </span><span style="color: #808080;">@param</span><span style="color: #008000;"> errorClasses
     * </span><span style="color: #808080;">@return</span>
     <span style="color: #008000;">*/</span>
    <span style="color: #0000ff;">public</span> RetryConfig configRetryConfig(<span style="color: #0000ff;">int</span> maxAttempts, <span style="color: #0000ff;">long</span> duration, Class&lt;? <span style="color: #0000ff;">extends</span> Throwable&gt;<span style="color: #000000;">[] errorClasses) {
        </span><span style="color: #0000ff;">return</span><span style="color: #000000;"> RetryConfig
                .custom()
                .maxAttempts(maxAttempts) </span><span style="color: #008000;">//</span><span style="color: #008000;">max retry times</span>
                .waitDuration(Duration.ofMillis(duration)) <span style="color: #008000;">//</span><span style="color: #008000;">retry duration</span>
                .retryExceptions(errorClasses) <span style="color: #008000;">//</span><span style="color: #008000;">tracing ex, if null trace all</span>
<span style="color: #000000;">                .build();
    }
}</span></pre>
<div class="cnblogs_code_toolbar"><span class="cnblogs_code_copy"><a href="javascript:void(0);" onclick="copyCnblogsCode(this)" title="复制代码"><img src="//common.cnblogs.com/images/copycode.gif" alt="复制代码"></a></span></div></div>
<p><strong>结合注解使用：</strong></p>
<div class="cnblogs_code">
<pre>@Retry(name = "xxx") //策略名称</pre>
</div>
<p><img src="https://img2020.cnblogs.com/blog/603942/202009/603942-20200904143655521-85996131.png" alt="" width="535" height="154" loading="lazy"></p>
<p>切面会根据配置的策略名称从&nbsp;RetryRegistry 查询获取相应的策略。</p>
<p>&nbsp;</p>
</div>
<div id="MySignature"></div>
<div class="clear"></div>
<div id="blog_post_info_block"><div id="BlogPostCategory">
    分类: 
            <a href="https://www.cnblogs.com/niejunlei/category/898923.html" target="_blank">Java</a></div>
<div id="EntryTag">
    标签: 
            <a href="https://www.cnblogs.com/niejunlei/tag/resilience4j-retry/">resilience4j-retry</a>,             <a href="https://www.cnblogs.com/niejunlei/tag/guava-retrying/">guava-retrying</a>,             <a href="https://www.cnblogs.com/niejunlei/tag/spring-retry/">spring-retry</a>,             <a href="https://www.cnblogs.com/niejunlei/tag/%E9%87%8D%E8%AF%95/">重试</a>,             <a href="https://www.cnblogs.com/niejunlei/tag/%E6%9C%8D%E5%8A%A1%E6%B2%BB%E7%90%86/">服务治理</a></div>

    <div id="blog_post_info">
<div id="green_channel">
        <a href="javascript:void(0);" id="green_channel_digg" onclick="DiggIt(13613783,cb_blogId,1);green_channel_success(this,'谢谢推荐！');">好文要顶</a>
        <a id="green_channel_follow" onclick="follow('f254240a-6c94-e311-8d02-90b11c0b17d6');" href="javascript:void(0);">关注我</a>
    <a id="green_channel_favorite" onclick="AddToWz(cb_entryId);return false;" href="javascript:void(0);">收藏该文</a>
    <a id="green_channel_weibo" href="javascript:void(0);" title="分享至新浪微博" onclick="ShareToTsina()"><img src="https://common.cnblogs.com/images/icon_weibo_24.png" alt=""></a>
    <a id="green_channel_wechat" href="javascript:void(0);" title="分享至微信" onclick="shareOnWechat()"><img src="https://common.cnblogs.com/images/wechat.png" alt=""></a>
</div>
<div id="author_profile">
    <div id="author_profile_info" class="author_profile_info">
            <a href="https://home.cnblogs.com/u/niejunlei/" target="_blank"><img src="https://pic.cnblogs.com/face/603942/20161021182112.png" class="author_avatar" alt=""></a>
        <div id="author_profile_detail" class="author_profile_info">
            <a href="https://home.cnblogs.com/u/niejunlei/">WindWant</a><br>
            <a href="https://home.cnblogs.com/u/niejunlei/followees/">关注 - 0</a><br>
            <a href="https://home.cnblogs.com/u/niejunlei/followers/">粉丝 - 52</a>
        </div>
    </div>
    <div class="clear"></div>
    <div id="author_profile_honor"></div>
    <div id="author_profile_follow">
                <a href="javascript:void(0);" onclick="follow('f254240a-6c94-e311-8d02-90b11c0b17d6');return false;">+加关注</a>
    </div>
</div>
<div id="div_digg">
    <div class="diggit" onclick="votePost(13613783,'Digg')">
        <span class="diggnum" id="digg_count">0</span>
    </div>
    <div class="buryit" onclick="votePost(13613783,'Bury')">
        <span class="burynum" id="bury_count">0</span>
    </div>
    <div class="clear"></div>
    <div class="diggword" id="digg_tips">
    </div>
</div>

<script type="text/javascript">
    currentDiggType = 0;
</script></div>
    <div class="clear"></div>
    <div id="post_next_prev">

    <a href="https://www.cnblogs.com/niejunlei/p/13463921.html" class="p_n_p_prefix">« </a> 上一篇：    <a href="https://www.cnblogs.com/niejunlei/p/13463921.html" title="发布于 2020-08-10 00:35">一面动态规划，一面广度优先</a>

</div>
</div>
            </div>
            <div class="postDesc">posted @ 
<span id="post-date">2020-09-04 14:52</span>&nbsp;
<a href="https://www.cnblogs.com/niejunlei/">WindWant</a>&nbsp;
阅读(<span id="post_view_count">40</span>)&nbsp;
评论(<span id="post_comment_count">0</span>)&nbsp;
<a href="https://i.cnblogs.com/EditPosts.aspx?postid=13613783" rel="nofollow">编辑</a>&nbsp;
<a href="javascript:void(0)" onclick="AddToWz(13613783);return false;">收藏</a></div>
        </div>