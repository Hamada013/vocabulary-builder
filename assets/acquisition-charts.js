/* Local, accessible acquisition charts, shared verbatim by independently hosted apps. */
((root)=>{
'use strict';
const colors={receptive:'#89cdef',expressive:'#23ad79'},labels={receptive:'الفهم',expressive:'التعبير'},domains=Object.keys(labels);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rate=(acquired,total,tested=0)=>({acquired,total,tested,percentage:total?Math.round(acquired/total*10000)/100:0});
const pct=value=>`${Number(value.percentage.toFixed(2))}%`;
const legend=()=>`<div class="acq-legend">${domains.map(d=>`<span><i style="background:${colors[d]}"></i>${labels[d]}</span>`).join('')}</div>`;
function table(rows){return `<div class="acq-table-wrap"><table><caption>الاكتساب من إجمالي عناصر الفئة</caption><thead><tr><th scope="col">الفئة</th>${domains.map(d=>`<th scope="col">${labels[d]}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${escape(row.label)}</th>${domains.map(d=>`<td data-domain="${d}" data-acquired="${row[d].acquired}" data-total="${row.total}"><bdi>${row[d].acquired} / ${row.total} · ${pct(row[d])}</bdi>${row[d].tested?'':'<small>لم يُقيّم</small>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function bar(rows,title='نسبة الاكتساب',axis='الفئات'){
 if(!rows.length)return '<p class="acq-empty">تظهر الفئات بعد بدء العمل عليها.</p>';
 const width=Math.max(430,rows.length*120+90),height=370,left=60,top=35,bottom=255,step=(width-left-20)/rows.length;
 let content=[0,25,50,75,100].map(value=>{const y=bottom-(bottom-top)*value/100;return `<line x1="${left}" x2="${width-15}" y1="${y}" y2="${y}" stroke="#e2ebf0"/><text x="${left-8}" y="${y+4}" text-anchor="end">${value}%</text>`;}).join('');
 rows.forEach((row,index)=>{const center=left+step*(index+.5),bw=Math.min(28,step/4);
 domains.forEach((d,j)=>{const value=row[d],h=(bottom-top)*value.percentage/100,x=center+(j?6:-bw-6);content+=`<rect data-domain="${d}" data-percentage="${value.percentage}" x="${x}" y="${bottom-h}" width="${bw}" height="${h}" rx="3" fill="${colors[d]}"><title>${escape(row.label)} · ${labels[d]}: ${value.acquired}/${row.total} (${pct(value)})</title></rect><text x="${j?x:x+bw}" y="${bottom-h-8}" text-anchor="${j?'start':'end'}" class="acq-value">${pct(value)}</text>`;});
 const words=String(row.shortLabel||row.label).split(/\s+/),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).trim().length>15&&lines.at(-1))lines.push(word);else lines[lines.length-1]=(lines.at(-1)+' '+word).trim();}
 content+=lines.slice(0,3).map((line,i)=>`<text x="${center}" y="${280+i*17}" text-anchor="middle" direction="rtl">${escape(line)}</text>`).join('');
 });
 return `<figure class="acq-chart"><figcaption>${escape(title)}</figcaption>${legend()}<div class="acq-chart-scroll" tabindex="0" role="region" aria-label="${escape(title)}؛ المحور الأفقي ${escape(axis)}؛ المحور الرأسي النسبة من 0 إلى 100 بالمئة"><svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="${escape(title)}"><text x="${left}" y="18">النسبة %</text>${content}<line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="#8fa8b7"/><line x1="${left}" y1="${bottom}" x2="${width-15}" y2="${bottom}" stroke="#8fa8b7"/><text x="${width/2}" y="360" text-anchor="middle">${escape(axis)}</text></svg></div>${table(rows)}</figure>`;
}
// Per category: two horizontal bars (comprehension, expression) instead of pie charts.
function categoryBars(rows){return `<div class="acq-hbars">${rows.map(row=>`<section class="acq-hbar-category"><h4>${escape(row.label)}</h4>${domains.map(d=>{const v=row[d];return `<div class="acq-hbar" role="img" aria-label="${labels[d]}: ${v.acquired} من ${row.total}، ${pct(v)}"><span class="acq-hbar-label">${labels[d]}</span><span class="acq-hbar-track"><i style="width:${v.percentage}%;background:${colors[d]}"></i></span><bdi class="acq-hbar-value" dir="ltr">${v.acquired} / ${row.total} · ${pct(v)}</bdi></div>`;}).join('')}</section>`).join('')}</div>`;}
const pies=categoryBars;
function drawBar(ctx,rows,{x=80,y=0,width=1080,height=460,title='نسبة الاكتساب',axis='الفئات'}={}){
 ctx.lineWidth=1;ctx.textBaseline='alphabetic';
 const text=(value,xx,yy,size=20,align='center')=>{ctx.font=`600 ${size}px system-ui,Tahoma,Arial,sans-serif`;ctx.fillStyle='#22445a';ctx.textAlign=align;ctx.direction=/^[\d.]+%$/.test(String(value))?'ltr':align==='right'?'rtl':'ltr';ctx.fillText(String(value),xx,yy);};
 text(title,x+width,y+28,28,'right');text('الفهم',x+55,y+65,20);ctx.fillStyle=colors.receptive;ctx.fillRect(x,y+50,18,18);text('التعبير',x+210,y+65,20);ctx.fillStyle=colors.expressive;ctx.fillRect(x+145,y+50,18,18);
 const left=x+65,top=y+100,bottom=y+height-120,step=(width-90)/Math.max(1,rows.length);
 for(const n of [0,25,50,75,100]){const yy=bottom-(bottom-top)*n/100;ctx.strokeStyle='#e2ebf0';ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(x+width,yy);ctx.stroke();text(`${n}%`,left-10,yy+5,18,'right');}
 ctx.strokeStyle='#8fa8b7';ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(x+width,bottom);ctx.stroke();
 rows.forEach((row,i)=>{const center=left+step*(i+.5),bw=Math.min(38,step/4);domains.forEach((d,j)=>{const v=row[d],h=(bottom-top)*v.percentage/100,xx=center+(j?10:-bw-10);ctx.fillStyle=colors[d];ctx.fillRect(xx,bottom-h,bw,h);text(pct(v),j?xx:xx+bw,bottom-h-12,18,j?'left':'right');});
 const value=row.shortLabel||row.label,words=String(value).split(/\s+/),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).length>17&&lines.at(-1))lines.push(word);else lines[lines.length-1]=(lines.at(-1)+' '+word).trim();}lines.slice(0,3).forEach((line,j)=>text(line,center,bottom+30+j*25,20));});text(axis,x+width/2,y+height-10,21);
}
// PDF version: the category title, then one bar per skill with its count and percentage.
function drawCategoryBars(ctx,row,{x=80,y=0,width=1080}={}){
 ctx.font='700 26px system-ui,Tahoma,Arial,sans-serif';ctx.fillStyle='#22445a';ctx.textAlign='right';ctx.direction='rtl';ctx.fillText(row.label,x+width,y+28);
 domains.forEach((d,i)=>{const v=row[d],yy=y+60+i*62,labelWidth=150,valueWidth=230,track=width-labelWidth-valueWidth-30,right=x+width-labelWidth;
  ctx.font='600 23px system-ui,Tahoma,Arial,sans-serif';ctx.fillStyle='#22445a';ctx.textAlign='right';ctx.direction='rtl';ctx.fillText(labels[d],x+width,yy+24);
  ctx.fillStyle='#e8f0f4';ctx.beginPath();ctx.roundRect(right-track,yy+4,track,26,13);ctx.fill();
  if(v.percentage){ctx.fillStyle=colors[d];ctx.beginPath();ctx.roundRect(right-track,yy+4,Math.max(26,track*v.percentage/100),26,13);ctx.fill();}
  ctx.fillStyle='#22445a';ctx.textAlign='left';ctx.direction='ltr';ctx.fillText(`${v.acquired} / ${row.total} · ${pct(v)}`,x,yy+24);});
}
const drawPies=drawCategoryBars;
const api={colors,labels,rate,pct,bar,pies,categoryBars,table,drawBar,drawPies,drawCategoryBars};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AcquisitionCharts=api;
})(globalThis);
