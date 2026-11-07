// Read this app's release inventory for the data and offline checks.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(module){
 const context={self:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/pwa-release.js'),'utf8'),context);
 const release=context.self.APP_RELEASE;
 const assets=release.media.map(a=>({...a,library:module}));
 const media=module==='voc'?Array.from({length:40},(_,i)=>assets.filter(a=>new RegExp(`^(images|sounds)/${i+1}/`).test(a.url))):assets;
 return {version:release.version,shell:release.shell,integrity:release.integrity,media};
};
