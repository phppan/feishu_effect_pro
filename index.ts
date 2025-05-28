import { basekit, FieldType, field, FieldComponent, FieldCode, NumberFormatter, AuthorizationType } from '@lark-opdev/block-basekit-server-api';
const { t } = field;

basekit.addDomainList(['open.ark.art']);

basekit.addField({
  authorizations: [
    {
      id: 'anke_auth_key',// 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
      platform: 'arkart_ai',// 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
      type: AuthorizationType.HeaderBearerToken,
      required: true,// 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
      instructionsUrl: "https://ark-tech.feishu.cn/wiki/HrBMwKFJni0tiakT4WRcHUtXnwb",// 帮助链接，告诉使用者如何填写这个apikey
      label: '暗壳AI授权',
      icon: {
        light: 'https://image.ark.art/icon/ark.art_light.png',
        dark: 'https://image.ark.art/icon/ark.art_dark.png'
      }
    }
  ],
  formItems: [{
      key: 'positive',
      label: '请选择提示词',
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Text]
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'images',
      label: "请选择空间场景图（结构图）",
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: true,
      }
    },
    {
      key: 'references',
      label: "请选择风格参考图",
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: false,
      }
    },
    {
      key: 'style',
      label: '请选择风格',
      component: FieldComponent.SingleSelect,
      validator: {
        required: false,
      },
      props: {
        options: [
          { label: '请选择风格', value: ''},
          { label: '住宅-禅韵现代', value: '10001'},
          { label: '住宅-现代北欧', value: '10002'},
          { label: '住宅-南法度假', value: '10004'},
          { label: '住宅-时尚中古', value: '10005'},
          { label: '住宅-都会轻奢', value: '10006'},
          { label: '住宅-意式低奢', value: '10007'},
          { label: '住宅-自然法式', value: '10008'},
          { label: '住宅-木作都会', value: '10009'},
          { label: '住宅-浪漫法式', value: '10015'},
          { label: '住宅-日式现代', value: '10017'},
          { label: '住宅-白色隐奢', value: '10011'},
          { label: '住宅-时谧东方', value: '10012'},
          { label: '住宅-冷翠轻奢', value: '10021'},
          { label: '住宅-哲思融合', value: '10022'},
          { label: '住宅-现代奶油', value: '10023'},
          { label: '住宅-静谧风', value: '10024'},
          { label: '住宅-原木极简', value: '10025'},
          { label: '住宅-惬意东方', value: '10026'},
          { label: '住宅-极简东方', value: '10027'},
          { label: '住宅-日式北欧', value: '10028'},
          { label: '会所-新古典东方', value: '10013'},
          { label: '会所-素影轻墨', value: '10014'},
          { label: '会所-隐贵谧静', value: '10010'},
          { label: '会所-浓郁东方', value: '10016'},
          { label: '会所-奢华东方', value: '10018'},
          { label: '会所-东方芝加哥', value: '10020'},
          { label: '酒店-海派艺术', value: '10019'},
          { label: '酒店-东方谧林', value: '10003'},
        ]
      },
    },
  ],
  resultType: {
    type: FieldType.Attachment,
  },
  // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
  execute: async (formItemParams, context) => {
    /** 为方便查看日志，使用此方法替代console.log */
    function debugLog(arg: any) {
      // @ts-ignore
      console.log(JSON.stringify({
        formItemParams,
        context,
        arg
      }))
    }

    function returnV(msg: string) {
      return {
        code: FieldCode.Success,
        data: [{
          name: msg + ".png",
          content:"https://kaifage.com/api/placeholder/600/400?color=000&bgColor=fff&text=" + encodeURIComponent(msg),
          contentType: 'attachment/url'
        }]
      };
    }
    try {
      debugLog(33)
      const { positive, images, references, style } = formItemParams;
      const image = images?.[0];
      const text= positive?.[0];
      const referenceObj = references?.[0];
      let reference = "";

      if (!image) {
        return returnV('请选择结构图')
      }

      if (!text) {
        return returnV('请输入提示词')
      }

      if (referenceObj) {
        reference = referenceObj.tmp_url;
      }

      const params = {
        image: image.tmp_url,
        reference: reference,
        positive: text.text,
        nev_prompt: "ugly, deformed, blurry",
        style: style?.value || '',
        line_strength: 0.60,
        line_start_percent: 0.00,
        line_end_percent: 0.70,
        depth_strength: 0.60,
        depth_start_percent: 0.00,
        depth_end_percent: 0.70,
        style_strength: 0.60
      }

      console.log(JSON.stringify(params))
      // 创建任务
      const createTaskRes = await context.fetch('https://open.ark.art/api/v1/task/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: 'effect_build_pro',
          num: 1,
          params: params
        })
      }, 'anke_auth_key');


      const createTaskData = await createTaskRes.json();
      
      debugLog(JSON.stringify(createTaskData))
      
      if (createTaskData.code !== 0 || !createTaskData.data?.task_id) {
        return returnV(createTaskData.msg || '生图失败')
      }

      // 轮询查询任务状态
      let retryCount = 0;
      const maxRetry = 168; // 修改为168次，每次5秒，总计14分钟
      while (retryCount < maxRetry) {
        const statusRes = await context.fetch(`https://open.ark.art/api/v1/task/status/${createTaskData.data.task_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }, 'anke_auth_key');

        const statusData = await statusRes.json();
        console.log(JSON.stringify(statusData));
        
        if (statusData.code !== 0) {
          debugLog(statusData)
          return {
            code: FieldCode.Error,
            message: statusData.msg || '查询任务状态失败'
          };
        }

        if (statusData.data.status === 'completed' && statusData.data.resources?.length > 0) {
          debugLog(statusData)
          return {
            code: FieldCode.Success,
            data: statusData.data.resources.map(url => ({
              name: `effect_build_${Date.now()}.png`,
              content: url,
              contentType: 'attachment/url'
            }))
          };
        }

        if (statusData.data.status === 'failed' || statusData.data.status === 'cancel') {
          debugLog(statusData)
          return returnV(statusData.data.message || '生图失败')
        }

        // 等待3秒后继续查询
        await new Promise(resolve => setTimeout(resolve, 5000));
        retryCount++;
      }

          return returnV('任务处理超时')
    } catch (error) {
      debugLog({
        '===999 未知错误': String(error)
      });
          return returnV(String(error))
    }
  },
});
export default basekit;