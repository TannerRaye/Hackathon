// Minimal front-end logic: mock AI checklist, canvas calendar, chat bot, leaderboard, settings
(function(){
  const LS_PREFIX='fa:'
  const el = id=>document.getElementById(id)

  // defaults
  const defaultUser = {name:'You',points:0}

  function loadSettings(){
    const s = JSON.parse(localStorage.getItem(LS_PREFIX+'settings')||'null') || defaultUser
    return s
  }
  function saveSettings(s){ localStorage.setItem(LS_PREFIX+'settings',JSON.stringify(s)) }

  // leaderboard
  function loadBoard(){return JSON.parse(localStorage.getItem(LS_PREFIX+'board')||'[]')}
  function saveBoard(b){localStorage.setItem(LS_PREFIX+'board',JSON.stringify(b))}

  // schedule storage (array of blocks)
  function loadSchedule(){return JSON.parse(localStorage.getItem(LS_PREFIX+'schedule')||'[]')}
  function saveSchedule(s){localStorage.setItem(LS_PREFIX+'schedule',JSON.stringify(s))}

  // mock data: assignments
  const assignments = [
    {id:1,course:'CS101',title:'Homework 4',due:addDays(new Date(),2),hours:2},
    {id:2,course:'MATH201',title:'Quiz prep',due:addDays(new Date(),1),hours:1.5},
    {id:3,course:'ENG150',title:'Essay draft',due:addDays(new Date(),5),hours:4}
  ]

  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}

  // render checklist
  function renderChecklist(){
    const container=el('checklist');container.innerHTML=''
    const list = generateChecklist(assignments, loadSettings())
    list.forEach(item=>{
      const it = document.createElement('div'); it.className='item';
      it.innerHTML = `<div><strong>${item.course}</strong> — ${item.title} <div style="font-size:12px;color:var(--muted)">${formatDate(item.due)} · ${item.hours} hr(s)</div></div>`
      const actions = document.createElement('div')
      const done = document.createElement('button'); done.className='btn small'; done.textContent='Done'
      done.onclick = ()=>{ it.classList.toggle('done'); givePoints(5) }
      actions.appendChild(done)
      it.appendChild(actions)
      container.appendChild(it)
    })
  }

  function formatDate(d){return new Date(d).toLocaleDateString()}

  function generateChecklist(assigns,settings){
    // very small heuristic: sort by soonest due then by hours
    return assigns.slice().sort((a,b)=>new Date(a.due)-new Date(b.due)||b.hours-a.hours)
  }

  // basic points handling
  function givePoints(n){ const s = loadSettings(); s.points = (s.points||0)+n; saveSettings(s); syncLeaderboard(s); renderLeaderboard(); }

  // leaderboard functions
  function renderLeaderboard(){
    const board = loadBoard(); const settings = loadSettings();
    // ensure current user present
    const present = board.find(x=>x.name===settings.name)
    if(!present) board.push({name:settings.name,points:settings.points||0})
    board.sort((a,b)=>b.points-a.points)
    saveBoard(board)
    const ul = el('leaderboard'); ul.innerHTML=''
    board.slice(0,10).forEach(p=>{ const li=document.createElement('li'); li.innerHTML=`<span>${p.name}</span><strong>${p.points}</strong>`; ul.appendChild(li) })
  }

  function syncLeaderboard(settings){ const board = loadBoard(); const idx = board.findIndex(x=>x.name===settings.name); if(idx>=0) board[idx].points = settings.points; else board.push({name:settings.name,points:settings.points||0}); saveBoard(board) }

  // chat bot mini
  function addChatLine(who,text){ const log=el('chatLog'); const div=document.createElement('div'); div.className='line'; div.innerHTML=`<strong>${who}</strong>: <span>${text}</span>`; log.appendChild(div); log.scrollTop = log.scrollHeight }

  async function handleChat(msg){ addChatLine('You',msg)
    // mock assistant: if message contains "add" or "schedule" propose adding an event
    let reply = "I recommend focusing on: \n"
    reply += assignments.map(a=>`• ${a.course} ${a.title} — due ${formatDate(a.due)}`).join('\n')
    reply += '\n\nSay "add [course] [hours]" to add a study block.'
    addChatLine('Assistant',reply)
  }

  // simple add study block flow
  function addStudyBlock(course, hours, dayOffset=0){ const sched=loadSchedule(); const start = new Date(); start.setDate(start.getDate()+dayOffset); const end = new Date(start); end.setHours(end.getHours()+hours); sched.push({id:Date.now(),course,from:start,to:end}); saveSchedule(sched); drawCalendar(); givePoints(Math.round(hours*2)) }

  // canvas calendar (very basic week grid)
  function drawCalendar(){
    const canvas = el('calendarCanvas'); const ctx = canvas.getContext('2d'); const w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h);
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; const colW = w/days.length; const hoursH = h/12; // show 8am-8pm
    ctx.fillStyle='#06111a'; ctx.fillRect(0,0,w,h)
    ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.font='12px sans-serif';
    days.forEach((d,i)=>{ ctx.fillText(d, i*colW+8, 16); ctx.strokeRect(i*colW,0,colW,h) })
    // draw study blocks from schedule
    const sched = loadSchedule(); sched.forEach(block=>{
      // map date to column by weekday
      const from = new Date(block.from); const wd = (from.getDay()+6)%7; const col = wd; const y = 20 + (from.getHours()-8)*hoursH; const hh = ( (new Date(block.to)-from) / 36e5 )*hoursH;
      ctx.fillStyle='rgba(110,231,183,0.9)'; ctx.fillRect(col*colW+6, Math.max(20,y), colW-12, Math.max(12,hh)); ctx.fillStyle='#012'; ctx.fillText(block.course+' • '+Math.round((new Date(block.to)-from)/36e5)+'h', col*colW+10, Math.max(36,y+12))
    })
  }

  // settings modal
  function openSettings(){ const s = loadSettings(); el('userName').value = s.name||''; el('userPoints').value = s.points||0; el('autoSchedule').value = s.autoSchedule===false? 'false':'true'; el('settingsModal').classList.remove('hidden') }
  function closeSettings(){ el('settingsModal').classList.add('hidden') }

  // Wire up
  function init(){
    // load default settings
    const s = loadSettings(); if(!s.name) { saveSettings(defaultUser) }
    renderChecklist(); renderLeaderboard(); drawCalendar(); renderSyllabus();

    el('regenChecklist').onclick = ()=>renderChecklist()
    el('settingsBtn').onclick = openSettings
    el('closeSettings').onclick = closeSettings
    el('saveSettings').onclick = ()=>{ const newS = {name:el('userName').value||'You',points:parseInt(el('userPoints').value||'0',10)||0,autoSchedule:el('autoSchedule').value==='true'}; saveSettings(newS); syncLeaderboard(newS); renderLeaderboard(); closeSettings() }
    el('joinLeaderboard').onclick = ()=>{ const s=loadSettings(); syncLeaderboard(s); renderLeaderboard(); addChatLine('System','Joined leaderboard as '+s.name) }
    el('chatForm').onsubmit = e=>{ e.preventDefault(); const v=el('chatInput').value.trim(); if(!v) return; handleChat(v); el('chatInput').value=''}
    el('addStudyBtn').onclick = ()=>{ const course = prompt('Course name?','Self-Study'); const hours = parseFloat(prompt('Hours?','1'))||1; addStudyBlock(course,hours,0) }
    // allow chat quick add: if user types "add XYZ 2" we'll parse
    // simple parser
    document.addEventListener('keydown', e=>{ if(e.key==='Enter'&&e.ctrlKey){ const v=el('chatInput').value.trim(); if(v.startsWith('add ')){ const parts=v.split(' '); const course=parts[1]||'Study'; const hours=parseFloat(parts[2])||1; addStudyBlock(course,hours,0); addChatLine('Assistant',`Added study block ${course} (${hours}h)`) el('chatInput').value='' } } })
  }

  function renderSyllabus(){ const p = `Generated syllabus summary:\n\n` + assignments.map(a=>`${a.course}: ${a.title} — due ${formatDate(a.due)} (est ${a.hours}h)`).join('\n'); el('syllabus').textContent = p }

  // initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init)

})();
