// 添加对css引用对象化的支持
declare module "*.css" {
    const css: {[key:string]: string};
    export default css;
}