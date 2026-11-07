const assert=require('node:assert/strict');
for(const [name,model]of [['VOC',require('../assets/game-model.js')]]){
 for(let length=2;length<=9;length++)for(let target=0;target<length;target++)for(const random of [()=>0,()=>.25,()=>.5,()=>.999]){
  const cards=Array.from({length},(_,i)=>({id:i})),copy=[...cards],result=model.shuffleAfterDemo(cards,target,random);
  assert.notEqual(result.indexOf(cards[target]),target,`${name}: answer must move even if shuffle returns its old position`);
  assert.deepEqual(new Set(result),new Set(cards));assert.deepEqual(cards,copy,'Do not mutate the demonstration order');
 }
 assert.deepEqual(model.shuffleAfterDemo(['only'],0),['only']);assert.deepEqual(model.shuffleAfterDemo([],0),[]);
}
console.log('PASS: the app moves demonstrated targets for every choice position, including unchanged random shuffles; preserve cards/input and single-choice safety.');
