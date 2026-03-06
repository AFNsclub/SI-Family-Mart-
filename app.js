import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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

let inv = {}, cart = [];

const fixNum = (num)=>(isNaN(num)||num==null)?0:Number(num);

// --- Inventory Sync ---
onSnapshot(collection(db,"inventory"), snap=>{
    let ops="<option value=''>পণ্য বাছুন</option>";
    snap.forEach(d=>{
        const data=d.data();
        inv[data.name]=data;
        ops+=`<option value="${data.name}">${data.name}</option>`;
    });
    if(document.getElementById('sItem')) document.getElementById('sItem').innerHTML=ops;
});

// --- Add Stock ---
window.addStock=async ()=>{
    const bc=document.getElementById('pBC').value;
    const n=document.getElementById('pN').value;
    const tB=fixNum(document.getElementById('tBuy').value);
    const tQ=fixNum(document.getElementById('tQty').value);
    const sP=fixNum(document.getElementById('pS').value);
    if(!n||tQ<1) return alert("সঠিক তথ্য দিন!");
    await setDoc(doc(db,"inventory",n),{barcode:bc,name:n,buy:tB/tQ,sell:sP,stock:increment(tQ)},{merge:true});
    alert("স্টক আপডেট হয়েছে!");
    location.reload();
};

// --- Cart ---
window.addToCart=()=>{
    const n=document.getElementById('sItem').value;
    const q=fixNum(document.getElementById('sQ').value);
    if(!n||q<1) return alert("সঠিক পণ্য ও পরিমাণ দিন");
    const item=inv[n];
    cart.push({name:n,qty:q,price:item.sell,buyPrice:item.buy,total:item.sell*q});
    renderCart();
};

window.removeItem=(i)=>{cart.splice(i,1); renderCart();};

function renderCart(){
    let h="";
    cart.forEach((it,i)=>{h+=`<tr><td>${it.name}</td><td>${it.price}</td><td>${it.qty}</td><td>${it.total}</td><td><button class="btn btn-sm text-danger" onclick="removeItem(${i})">✖</button></td></tr>`;});
    document.getElementById('cartBody').innerHTML=h;
}

// --- Finalize Sale ---
window.finalizeSale=async ()=>{
    if(cart.length===0) return alert("কার্ট খালি!");
    const cust=document.getElementById('cust').value||"সম্মানিত ক্রেতা";
    const dVal=fixNum(document.getElementById('totalDisc').value);
    const dType=document.getElementById('totalDType').value;

    let sub=cart.reduce((s,it)=>s+it.total,0);
    let dAmt=(dType==='percent')?(sub*dVal/100):dVal;
    let grand=sub-dAmt;
    let profit=(sub-cart.reduce((s,it)=>s+(fixNum(it.buyPrice)*it.qty),0))-dAmt;

    const now=new Date();
    const dateStr=now.toISOString().split('T')[0];

    for(let it of cart) await updateDoc(doc(db,"inventory",it.name),{stock:increment(-it.qty)});
    const sDoc=await addDoc(collection(db,"sales"),{customer:cust,items:cart,total:fixNum(grand),profit:fixNum(profit),date:dateStr,time:now.toLocaleTimeString()});

    let rHtml="";
    cart.forEach(it=>rHtml+=`<tr><td>${it.name}</td><td class="text-center">${it.qty}</td><td class="text-end">${it.total}</td></tr>`);
    document.getElementById('rItemsBody').innerHTML=rHtml;
    document.getElementById('rCust').innerText=cust;
    document.getElementById('rID').innerText=sDoc.id.substring(0,7).toUpperCase();
    document.getElementById('rDate').innerText=dateStr;
    document.getElementById('rTime').innerText=now.toLocaleTimeString();
    document.getElementById('rSub').innerText=Math.round(sub);
    document.getElementById('rGrand').innerText=Math.round(grand);

    if(dAmt>0){document.getElementById('rDiscRow').style.setProperty('display','flex','important'); document.getElementById('rDisc').innerText=Math.round(dAmt);}
    document.querySelector('.container').style.display='none';
    document.getElementById('receipt').style.display='block';
};

// --- Report Search ---
window.search=async ()=>{
    const f=document.getElementById('dF').value, t=document.getElementById('dT').value;
    if(!f||!t) return alert("তারিখ সিলেক্ট করুন");
    const q=query(collection(db,"sales"),where("date",">=",f),where("date","<=",t));
    const snap=await getDocs(q);
    let s=0,p=0,count=0;
    snap.forEach(d=>{s+=fixNum(d.data().total); p+=fixNum(d.data().profit); count++;});
    document.getElementById('repSale').innerText="৳ "+Math.round(s);
    document.getElementById('repProfit').innerText="৳ "+Math.round(p);
    document.getElementById('repDetails').innerHTML=`নির্বাচিত সময়ে মোট <b>${count}</b> টি মেমো।<br>নিট লাভ: <b>${s>0?((p/s)*100).toFixed(1):0}%</b>`;
};
