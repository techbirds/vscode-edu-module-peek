

# Edu Module Peek :rocket:

> 极速定位NEJ Module，包括组件池、NEJ等等


## 安装

在VSCode中按下`F1`，输入`ext install`，然后查找`Edu Module Peek`。

## 配置

> 智能识别特殊路径标识前缀.


### Mac 

```javascript
{
	"module_peek.mappings": {
            "pool":"${workspaceRoot}/src/javascript/lib", 
            "nej": "${workspaceRoot}/src/javascript/lib/nej/src",
            "text!":"",
            "css!": ""
	}
}
```

### Windows

```javascript
{
	"module_peek.mappings": {
            "pool":"${workspaceRoot}\\src\\javascript\\lib",
            "nej": "${workspaceRoot}\\src\\javascript\\lib\\nej\\src",
            "text!":"",
            "css!": ""
	}
}
```

注: 这里`pool`是我本人项目中组件池目录，这因项目不同而不同。

## 使用

![path](./images/demo.gif)


## 支持的操作系统

```
Windows, Linux, MacOS
```

## 感谢

* [VSCode](https://code.visualstudio.com/)

## FAQ

### Mac下使用不够丝滑

> 项目中第一次使用时可能会比较慢，尤其当工程文件较多的时候，建立索引的时间会消耗比较大. 可惜的是这个过程当重新打开工程必然会执行一次。在Mac下这个过程会比较慢，但在Windows下整个使用却过程非常丝滑.

* [Go to Definition and Navigation is very slow in a large file](https://github.com/Microsoft/visualfsharp/issues/1941)


## 开源协议

[MIT](LICENSE)
