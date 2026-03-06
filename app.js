// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, increment, onSnapshot, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBI8FZjLO48gYACKhJRkptj-y03NHRK5Ho",
  authDomain: "fir-i-family-mart.firebaseapp.com",
  projectId: "fir-i-family-mart",
  storageBucket: "fir-i-family-mart.firebasestorage.app",
  messagingSenderId: "73889024539",
  appId: "1:73889024539:web:271561c9dba17b5a6b06be"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================== Login System ==================
if(document.getElementById('loginBtn')){
  document.getElementById('loginBtn').addEventListener('click', async ()=>{
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(!email || !pass) return alert("Email & Password দিতে হবে!");
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Login Success!");
      window.location.href="index.html";
    }catch(err){ alert("Login Failed: "+err.message); }
  });
}

if(document.getElementById('logoutBtn')){
  document.getElementById('logoutBtn').addEventListener('click', async ()=>{
    await signOut(auth);
    window.location.href="login.html";
  });
}

// ================== Inventory & POS Logic ==================
let inv = {}; let cart = [];

const fixNum = n => (isNaN(n) || n==null)?0:Number(n);

window.addToCart = ()=>{
  const n = document.getElementById('sItem').value;
  const q = fixNum(document.getElementById('sQ').value);
  if(!n||q<1)return alert("সঠিক পণ্য ও পরিমাণ দিন!");
  const item = inv[n];
  cart.push({name:n, qty:q, price:item.sell, buyPrice:item.buy, total:item.sell*q});
  renderCart();
}

function renderCart(){
  let h=""; cart.forEach((it,i)=>h+=`<tr><td>${it.name}</td><td>${it.price}</td><td>${it.qty}</td><td>${it.total}</td><td><button class="btn btn-sm text-danger" onclick="removeItem(${i})">✖</button></td></tr>`);
  document.getElementById('cartBody')?document.getElementById('cartBody').innerHTML=h:null;
}

window.removeItem=i=>{ cart.splice(i,1); renderCart(); }

onSnapshot(collection(db,"inventory"),snap=>{
  let ops="<option value=''>পণ্য বাছুন</option>";
  let iVal=0;
  snap.forEach(d=>{
    const data=d.data();
    inv[data.name]=data;
    ops+=`<option value="${data.name}">${data.name}</option>`;
    iVal+=fixNum(data.buy)*fixNum(data.stock);
  });
  document.getElementById('sItem')?document.getElementById('sItem').innerHTML=ops:null;
  document.getElementById('iV')?document.getElementById('iV').innerText=Math.round(iVal):null;
});

window.addStock=async ()=>{
  const bc=document.getElementById('pBC').value;
  const n=document.getElementById('pN').value;
  const tB=fixNum(document.getElementById('tBuy').value);
  const tQ=fixNum(document.getElementById('tQty').value);
  const sP=fixNum(document.getElementById('pS').value);
  if(!n||tQ<1)return alert("সঠিক তথ্য দিন!");
  await setDoc(doc(db,"inventory",n),{barcode:bc,name:n,buy:tB/tQ,sell:sP,stock:increment(tQ)},{merge:true});
  alert("স্টক আপডেট হয়েছে!");
  location.reload();
}

// ================== Sales Finalize ==================
window.finalizeSale=async ()=>{
  if(cart.length===0)return alert("কার্ট খালি!");
  const cust=document.getElementById('cust')?document.getElementById('cust').value||"সম্মানিত ক্রেতা":"Customer";
  const dVal=fixNum(document.getElementById('totalDisc')?document.getElementById('totalDisc').value:0);
  const dType=document.getElementById('totalDType')?document.getElementById('totalDType').value:'cash';
  let sub=cart.reduce((s,it)=>s+it.total,0);
  let dAmt=(dType==='percent')?sub*dVal/100:dVal;
  let grand=sub-dAmt;
  let profit=(sub-cart.reduce((s,it)=>s+fixNum(it.buyPrice)*it.qty,0))-dAmt;
  const now=new Date();
  const dateStr=now.toISOString().split('T')[0];

  for(let it of cart){ await updateDoc(doc(db,"inventory",it.name),{stock:increment(-it.qty)}); }
  const sDoc=await addDoc(collection(db,"sales"),{customer:cust,items:cart,total:fixNum(grand),profit:fixNum(profit),date:dateStr,time:now.toLocaleTimeString()});

  if(document.getElementById('rItemsBody')){
    let rHtml=""; cart.forEach(it=>rHtml+=`<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.total}</td></tr>`);
    document.getElementById('rItemsBody').innerHTML=rHtml;
    document.getElementById('rCust').innerText=cust;
    document.getElementById('rID').innerText=sDoc.id.substring(0,7).toUpperCase();
    document.getElementById('rDate').innerText=dateStr;
    document.getElementById('rTime').innerText=now.toLocaleTimeString();
    document.getElementById('rSub').innerText=Math.round(sub);
    document.getElementById('rGrand').innerText=Math.round(grand);
    if(dAmt>0){ document.getElementById('rDiscRow').style.setProperty('display','flex','important'); document.getElementById('rDisc').innerText=Math.round(dAmt);}
    document.querySelector('.container')?document.querySelector('.container').style.display='none':null;
    document.getElementById('receipt')?document.getElementById('receipt').style.display='block':null;
  }
}

// ================== Real-time Stats ==================
onSnapshot(collection(db,"sales"),snap=>{
  let dS=0,dP=0;
  const today=new Date().toISOString().split('T')[0];
  snap.forEach(d=>{
    const data=d.data();
    const total=fixNum(data.total);
    const profit=fixNum(data.profit);
    if(data.date===today){ dS+=total; dP+=profit; }
  });
  document.getElementById('dS')?document.getElementById('dS').innerText=Math.round(dS):null;
  document.getElementById('dP')?document.getElementById('dP').innerText=Math.round(dP):null;
}

// ================== Supplier ==================
window.addSupplier=async ()=>{
  const n=document.getElementById('sName').value;
  const p=document.getElementById('sPhone').value;
  const a=document.getElementById('sAddress').value;
  if(!n)return alert("Supplier Name দিন!");
  await addDoc(collection(db,"suppliers"),{name:n,phone:p,address:a});
  alert("Supplier Added!");
  location.reload();
}

// ================== Expense ==================
window.addExpense=async ()=>{
  const n=document.getElementById('expName').value;
  const a=fixNum(document.getElementById('expAmt').value);
  const d=document.getElementById('expDate').value;
  if(!n||a<=0)return alert("সঠিক তথ্য দিন!");
  await addDoc(collection(db,"expenses"),{name:n,amount:a,date:d});
  alert("Expense Added!");
  location.reload();
}

// ================== Report Search ==================
window.search=async ()=>{
  const f=document.getElementById('dF').value;
  const t=document.getElementById('dT').value;
  if(!f||!t)return alert("তারিখ সিলেক্ট করুন!");
  const q=query(collection(db,"sales"),where("date",">=",f),where("date","<=",t));
  const snap=await getDocs(q);
  let s=0,p=0,count=0;
  snap.forEach(d=>{ s+=fixNum(d.data().total); p+=fixNum(d.data().profit); count++; });
  document.getElementById('repSale')?document.getElementById('repSale').innerText="৳ "+Math.round(s):null;
  document.getElementById('repProfit')?document.getElementById('repProfit').innerText="৳ "+Math.round(p):null;
  document.getElementById('repDetails')?document.getElementById('repDetails').innerHTML=`মোট <b>${count}</b> টি মেমো তৈরি হয়েছে। নিট লাভের হার: <b>${s>0?((p/s)*100).toFixed(1):0}%</b>`:null;
}
