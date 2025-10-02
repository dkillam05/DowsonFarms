(function(){
  const links = (window.DF_FOOTER_LINKS || []);
  if(!links.length) return;

  const bar = document.createElement('nav');
  bar.setAttribute('aria-label','Bottom navigation');
  bar.style.position='fixed';
  bar.style.inset='auto 0 0 0';
  bar.style.background='#0f5a1a';
  bar.style.height='54px';
  bar.style.display='grid';
  bar.style.gridTemplateColumns=`repeat(${links.length},1fr)`;
  bar.style.alignItems='center';
  bar.style.borderTop='1px solid #0003';
  bar.style.zIndex='80';

  links.forEach(l=>{
    const a = document.createElement('a');
    a.href = l.href;
    a.style.display='flex';
    a.style.flexDirection='column';
    a.style.alignItems='center';
    a.style.justifyContent='center';
    a.style.textDecoration='none';
    a.style.color='#fff';
    a.style.fontSize='12px';
    a.innerHTML = `<div style="font-size:20px;line-height:1">${l.icon||'•'}</div><div>${l.label}</div>`;
    bar.appendChild(a);
  });

  document.body.appendChild(bar);
  // add bottom padding so content isn't hidden
  document.body.style.paddingBottom = '56px';
})();