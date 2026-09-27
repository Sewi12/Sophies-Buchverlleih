const KEY="book-loan-data-v1";
let state=JSON.parse(localStorage.getItem(KEY)||'{"books":[],"people":[],"history":[]}');
let filter="all";
let view="books";

const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
function render(){
 if(view==="history"){renderHistory();return;}
 const q=$("search").value.trim().toLowerCase();
 const list=state.books.filter(b=>
   (filter==="all"||(filter==="mine"&&!b.lent)||(filter==="lent"&&b.lent)) &&
   (!q||`${b.title} ${b.author||""} ${b.person||""}`.toLowerCase().includes(q))
 );
 $("books").innerHTML=list.length?list.map(bookCard).join():'<div class="empty">Noch keine Bücher vorhanden.<br>Füge dein erstes Buch hinzu.</div>';
 document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===filter));
 $("books").hidden=false;$("history").hidden=true;
}
function renderHistory(){
 $("books").hidden=true;$("history").hidden=false;
 const items=[...state.history].reverse();
 if(!items.length){$("history").innerHTML='<div class="empty">Noch kein Rückblick vorhanden.<br>Hier siehst du später, wem Bücher ausgeliehen wurden.</div>';}
 else $("history").innerHTML='<h2 style="font-size:22px;margin:8px 0 12px">Rückblick</h2>'+items.map(h=>{const b=state.books.find(x=>x.id===h.bookId);return `<article class="history-item"><div class="history-title">${esc(b?.title||"Buch nicht mehr vorhanden")}</div><div class="history-meta">Ausgeliehen an: <b>${esc(h.person)}</b><br>Am: ${formatDate(h.date)}${h.returnedDate?`<br>Zurück: ${formatDate(h.returnedDate)}`:'<br><b>Aktuell noch verliehen</b>'}</div></article>`}).join('');
 document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
 $("booksTab").classList.toggle("active",view==="books");$("historyTab").classList.toggle("active",view==="history");
}
function bookCard(b){
 return `<article class="card"><div class="row"><div class="cover"></div><div class="info">
<div class="title">${esc(b.title)}</div><div class="author">${esc(b.author||"")}</div>
<span class="status ${b.lent?"lent":""}">${b.lent?"🟠 Verliehen":"🟢 Bei mir"}</span>
${b.lent?`<div class="meta">An: <b>${esc(b.person)}</b><br>Seit: ${formatDate(b.lentDate)}</div>`:""}
<div class="actions">${b.lent?`<button onclick="returnBook('${b.id}')">↩ Zurückerhalten</button>`:`<button onclick="lendBook('${b.id}')">📤 Verleihen</button>`}<button onclick="editBook('${b.id}')">Bearbeiten</button></div>
</div></div></article>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function formatDate(s){return s?new Date(s+"T00:00:00").toLocaleDateString("de-AT"):""}
$("addBtn").onclick=()=>openBook();
$("search").oninput=render;
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});
function openBook(id){
 const b=state.books.find(x=>x.id===id);
 $("bookId").value=b?.id||"";$("title").value=b?.title||"";$("author").value=b?.author||"";$("isbn").value=b?.isbn||"";
 $("bookDialog").showModal();
}
$("bookForm").onsubmit=e=>{
 e.preventDefault(); const id=$("bookId").value;
 const data={title:$("title").value.trim(),author:$("author").value.trim(),isbn:$("isbn").value.trim()};
 if(id) Object.assign(state.books.find(b=>b.id===id),data);
 else state.books.push({id:crypto.randomUUID(),...data,lent:false});
 $("bookDialog").close();save();
};
function editBook(id){openBook(id)}
function lendBook(id){
 $("lendBookId").value=id;$("person").value="";$("lendDate").value=today();
 $("peopleList").innerHTML=state.people.map(p=>`<option value="${esc(p)}">`).join("");
 $("lendDialog").showModal();
}
$("lendForm").onsubmit=e=>{
 e.preventDefault();const id=$("lendBookId").value,b=state.books.find(x=>x.id===id),person=$("person").value.trim(),date=$("lendDate").value||today();
 if(!person)return;
 b.lent=true;b.person=person;b.lentDate=date;
 if(!state.people.includes(person))state.people.push(person);
 state.history.push({bookId:id,person,date,returnedDate:null});
 $("lendDialog").close();save();
};
function returnBook(id){
 const b=state.books.find(x=>x.id===id); if(!b)return;
 const h=[...state.history].reverse().find(x=>x.bookId===id&&!x.returnedDate);
 if(h)h.returnedDate=today();
 b.lent=false;delete b.person;delete b.lentDate;save();
}
$("booksTab").onclick=()=>{view="books";render();};
$("historyTab").onclick=()=>{view="history";render();};
render();
