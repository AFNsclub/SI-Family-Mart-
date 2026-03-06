// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, updateDoc, increment, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Redirect if not logged in
onAuthStateChanged(auth,user=>{if(!user)window.location="login.html";});

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn)logoutBtn.addEventListener('click',async()=>{await signOut(auth);window.location="login.html";});

// Utility
const fixNum=num=>isNaN(num)||num==null?0:Number(num);

// Inventory & Cart
export let inv = {}; export let cart = [];

window.addToCart=()=>{
    const n=document.getElementById('sItem').value;
    const q=fixNum(document.getElementById('sQ').value);
    if(!n||q<1)return alert("Select valid product & quantity!");
    const item=inv[n];
    cart.push({name:n,qty:q,price:item.sell,buyPrice:item.buy,total:item.sell*q});
    renderCart();
};

window.removeItem=i=>{cart.splice(i,1);renderCart();};
function renderCart(){
    let h="";
    cart.forEach((it,i)=>{h+=`<tr><td>${it.name}</td><td>${it.price}</td><td>${it.qty}</td><td>${it.total}</td><td><button class="btn btn-sm text-danger" onclick="removeItem(${i})">✖</button></td></tr>`;});
    const el=document.getElementById('cartBody'); if(el)el.innerHTML=h;
}

// Inventory Sync
onSnapshot(collection(db,"inventory"),snap=>{
    let l="<table class='table table-sm'><thead><tr><th>Barcode</th><th>Name</th><th>Stock</th><th>Sell</th></tr></thead><tbody>";
    let ops="<option value=''>Select Product</option>";
    let iVal=0;
    snap.forEach(d=>{
        const data=d.data();
        inv[data.name]=data;
        l+=`<tr><td>${data.barcode}</td><td>${data.name}</td><td>${data.stock}</td><td>${data.sell}</td></tr>`;
        ops+=`<option value="${data.name}">${data.name}</option>`;
        iVal+=fixNum(data.buy)*fixNum(data.stock);
    });
    const sl=document.getElementById('stockList'); if(sl)sl.innerHTML=l+"</tbody></table>";
    const si=document.getElementById('sItem'); if(si)si.innerHTML=ops;
    const iv=document.getElementById('iV'); if(iv)iv.innerText=Math.round(iVal);
});

// Add Stock
window.addStock=async()=>{
    const bc=document.getElementById('pBC').value;
    const n=document.getElementById('pN').value;
    const tB=fixNum(document.getElementById('tBuy').value);
    const tQ=fixNum(document.getElementById('tQty').value);
    const sP=fixNum(document.getElementById('pS').value);
    if(!n||tQ<1)return alert("Provide valid info!");
    await setDoc(doc(db,"inventory",n),{barcode:bc,name:n,buy:tB/tQ,sell:sP,stock:increment(tQ)},{merge:true});
    alert("Stock updated!"); location.reload();
};

// Finalize Sale
window.finalizeSale=async()=>{
    if(cart.length===0)return alert("Cart is empty!");
    const cust=document.getElementById('cust').value||"Valued Customer";
    const dVal=fixNum(document.getElementById('totalDisc').value);
    const dType=document.getElementById('totalDType').value;

    let sub=cart.reduce((s,it)=>s+it.total,0);
    let dAmt=dType==='percent'?sub*dVal/100:dVal;
    let grand=sub-dAmt;
    let profit=(sub-cart.reduce((s,it)=>s+fixNum(it.buyPrice)*it.qty,0))-dAmt;

    const now=new Date();
    const dateStr=now.toISOString().split('T')[0];

    for(let it of cart)await updateDoc(doc(db,"inventory",it.name),{stock:increment(-it.qty)});
    const sDoc=await addDoc(collection(db,"sales"),{customer:cust,items:cart,total:fixNum(grand),profit:fixNum(profit),date:dateStr,time:now.toLocaleTimeString()});

    // Receipt
    let rHtml=""; cart.forEach(it=>rHtml+=`<tr><td>${it.name}</td><td class="text-center">${it.qty}</td><td class="text-end">${it.total}</td></tr>`);
    document.getElementById('rItemsBody').innerHTML=rHtml;
    document.getElementById('rCust').innerText=cust;
    document.getElementById('rID').innerText=sDoc.id.substring(0,7).toUpperCase();
    document.getElementById('rDate').innerText=dateStr;
    document.getElementById('rTime').innerText=now.toLocaleTimeString();
    document.getElementById('rSub').innerText=Math.round(sub);
    document.getElementById('rGrand').innerText=Math.round(grand);
    if(dAmt>0){document.getElementById('rDiscRow').style.setProperty('display','flex','important');document.getElementById('rDisc').innerText=Math.round(dAmt);}
    document.querySelector('.container').style.display='none';
    document.getElementById('receipt').style.display='block';
};

// Real-time Stats
onSnapshot(collection(db,"sales"),snap=>{
    let dS=0,dP=0,mS=0,mP=0;
    const today=new Date().toISOString().split('T')[0];
    const month=today.substring(0,7);
    snap.forEach(d=>{
        const data=d.data();
        const total=fixNum(data.total), profit=fixNum(data.profit);
        if(data.date===today){dS+=total; dP+=profit;}
        if(data.date && data.date.startsWith(month)){mS+=total;mP+=profit;}
    });
    const elD=document.getElementById('dS'); if(elD)elD.innerText=Math.round(dS);
    const elP=document.getElementById('dP'); if(elP)elP.innerText=Math.round(dP);
});
