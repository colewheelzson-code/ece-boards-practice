(function(){
  const key='ece-boards-theme-global-v1';
  const legacyKey='ece-boards-theme-preboard-math-v1';
  const themes=['default','light','midnight'];
  const stored=localStorage.getItem(key)||localStorage.getItem(legacyKey)||'default';
  const theme=themes.includes(stored)?stored:'default';
  function apply(value){
    const selected=themes.includes(value)?value:'default';
    if(selected==='default'){
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
    }else{
      document.documentElement.setAttribute('data-theme',selected);
      document.body.setAttribute('data-theme',selected);
    }
    localStorage.setItem(key,selected);
    document.querySelectorAll('#themeSelect').forEach(select=>{if(select.value!==selected)select.value=selected;});
  }
  document.querySelectorAll('#themeSelect').forEach(select=>{
    select.value=theme;
    const update=()=>apply(select.value);
    select.addEventListener('change',update);
    select.addEventListener('input',update);
  });
  apply(theme);
})();
