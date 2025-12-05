代码限制规范:
* use serena
* 用中文回答我
* 不需要启动项目因为我后台已经默认启动
* 使用ts而不是js
* 不允许自动帮我提交和写入git操作, git只能读取
* 使用emo替换npm和pnpm(emo命令和pnpm一样效果)
* 写代码之前你要告诉sota方案, 然后去执行sota方案
* 文件和文件夹用小写加破折号-来组合, 包括组件名称
* 单个文件行数不能超过700行
* 尽可能拆分文件, 都放到对应文件夹里, 比如components/image.tsx, constants/index.ts, configs, hooks, utils(无副作用), helpers(有副作用的), types, styles等
* 生成的代码要有标准的中文注释
* 不要新建测试文件, 除非我主动要求
* 除非特殊情况， 尽量不要使用settimeout
* 临时生成的文件最后记得移除掉
* 如果要撰写前端组件, 则组件优先放到当前目录下的components文件夹下, 例如: ./components/criterion/index.vue
* 尽量避免递归逻辑
* 避免使用 tailwind 的 bg-indigo-500 系列, 整体色系应该符合企业设计而不是花花绿绿