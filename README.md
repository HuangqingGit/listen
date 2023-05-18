# listen

### 基础配置项
  > 1 在node_modules\@im\im-sdk-plus\dist路径中导入该项目包
  
  > 2 在node_modules\@im\im-sdk-plus\dist\cjs\index.js文件中用 `require` 函数导入该项包 ，如下：
  
  ```JavaScript
    var listen = require('@im/im-sdk-plus/dist/listen')
  ```
    
  > 3 Ctrl + F 搜索 `onNewMessage()` 函数,大约在7370行左右，在onNewMessage函数中执行该函数 ，如下
  
  ```JavaScript
    listen(pbMessage, targetType, this)
  ```
  三个参数缺一不可，需要带上this指向
