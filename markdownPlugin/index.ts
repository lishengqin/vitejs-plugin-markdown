import { Plugin } from "vite";
/* @ts-ignore */
import path from "path";
/* @ts-ignore */
import fs from "fs";
import MarkdownIt from 'markdown-it';

const markdownExp = /<g-markdown[^]*?<\/g-markdown>/g;
const filePathRE = /(?<=file=("|')).*(?=('|"))/;
const md = new MarkdownIt();

const mdRelationMap = {};
function markdownPlugin(): Plugin {
  return {
    /* 插件名称 */
    name: "vite:markdown",
    /**强制插件排序,
      * pre：在 Vite 核心插件之前调用该插件
      * post：在 Vite 构建插件之后调用该插件
      * 默认：在 Vite 核心插件之后调用该插件
    */
    // 我们需要在之前调用，因为我们要的是源码字符串，而不是编译解析后的
    enforce: "pre",
    /* 配置热重载 */
    handleHotUpdate(ctx) {
      const { file, server, modules } = ctx
      if (path.extname(file) !== ".md") return
      const relationIds = mdRelationMap[path.resolve(file)];
      const relationModules = []
      relationIds.forEach(relationId => {
        const relationModule = [...server.moduleGraph.getModulesByFile(relationId)!][0];
        server.ws.send({
          type: 'update',
          updates: [
            {
              type: 'js-update',
              path: relationModule.file!,
              acceptedPath: relationModule.file!,
              timestamp: new Date().getTime()
            }
          ]
        });
        relationModules.push(relationModule)
      })
      return [...modules, ...relationModules]
    },
    transform(code, id, opt) {
      /* 在编译和构建会执行该方法 */
      if (id.indexOf(".vue") > -1) {
        const markdownMathList = code.match(markdownExp) || [];
        (markdownMathList).forEach(one => {
          let mdPath = one.match(filePathRE)[0];
          const mdFilePath = path.resolve(path.dirname(id), mdPath);
          const mdText = fs.readFileSync(mdFilePath, "utf-8");
          const htmlText = md.render(mdText);
          code = code.replace(one, htmlText)
          if (!mdRelationMap[mdFilePath]) {
            mdRelationMap[mdFilePath] = [];
          }
          mdRelationMap[mdFilePath].push(id)
        })
        return code
      }
    }
  }
}
export default markdownPlugin;