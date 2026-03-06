import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, doc, updateDoc, increment, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

let inv = {}; let cart = [];

// --- Cart ---
window.addToCart = () => {
    const n = document.getElementById('sItem')?.value;
    const q = Number(document.getElementById('sQ')?.value || 0);
    if(!n || q <1) return alert("সঠিক পণ্য দিন");
    const item = inv[n];
    cart.push({ name:n, qty:q, price:item.sell, buyPrice:item.buy, total:item.sell*q });
    renderCart();
};
function renderCart(){
    let h=""; cart.forEach((it,i)=> h+=`<tr><td>${it.name}</td><td>${it.price}</td><td>${it.qty}</td><td>${it.total}</td><td><button onclick="removeItem(${i})">✖</button></td></tr>`);
    document.getElementById('cartBody')?.innerHTML=h;
}
window.removeItem=(i)=>{ cart.splice(i,1); renderCart(); };

// --- Inventory ---
onSnapshot(collection(db,"inventory"),snap=>{
    let ops="<option value=''>পণ্য বাছুন</option>"; let iVal=0;
    snap.forEach(d=>{
        const data=d.data();
        inv[data.name]=data;
        ops+=`<option value="${data.name}">${data.name}</option>`;
        iVal+=Number(data.buy)*Number(data.stock);
    });
    document.getElementById('sItem')?.innerHTML=ops;
    document.getElementById('iV')?.innerText=Math.round(iVal);
});

// --- Add Stock ---
window.addStock=async()=>{
    const bc=document.getElementById('pBC').value;
    const n=document.getElementById('pN').value;
    const tB=Number(document.getElementById('tBuy').value);
    const tQ=Number(document.getElementById('tQty').value);
    const sP=Number(document.getElementById('pS').value);
    if(!n || tQ<1) return alert("সঠিক তথ্য দিন!");
    await setDoc(doc(db,"inventory",n),{ barcode:bc,name:n,buy:tB/tQ,sell:sP,stock:increment(tQ)},{merge:true});
    alert("স্টক আপডেট হয়েছে!");
    location.reload();
};

// --- Finalize Sale ---
window.finalizeSale=async()=>{
    if(cart.length===0) return alert("কার্ট খালি!");
    const cust=document.getElementById('cust')?.value||"সম্মানিত ক্রেতা";
    let sub=cart.reduce((s,it)=>s+it.total,0);
    const dVal=Number(document.getElementById('totalDisc')?.value||0);
    const dType=document.getElementById('totalDType')?.value;
    let dAmt=(dType==='percent')?sub*dVal/100:dVal;
    let grand=sub-dAmt;
    for(let it of cart) await updateDoc(doc(db,"inventory",it.name),{ stock:increment(-it.qty) });
    const sDoc=await addDoc(collection(db,"sales"),{ customer:cust,items:cart,total:grand,date:new Date().toISOString().split('T')[0],profit:sub-dAmt });
    alert("বিক্রি সম্পন্ন");
    cart=[]; renderCart();
};

// --- Supplier ---
window.addSupplier=async()=>{
    const name=document.getElementById('supName').value;
    const phone=document.getElementById('supPhone').value;
    if(!name || !phone) return alert("Supplier Name ও Phone লাগবে");
    await addDoc(collection(db,"suppliers"),{name,phone});
    alert("Supplier Added!"); location.reload();
};

// --- Expenses ---
window.addExpense=async()=>{
    const name=document.getElementById('expName').value;
    const amt=Number(document.getElementById('expAmount').value);
    const date=document.getElementById('expDate').value;
    if(!name || !amt || !date) return alert("সঠিক তথ্য দিন");
    await addDoc(collection(db,"expenses"),{name,amt,date});
    alert("Expense Added!"); location.reload();
};

// --- Reports ---
window.search=async()=>{
    const f=document.getElementById('dF').value;
    const t=document.getElementById('dT').value;
    if(!f||!t) return alert("তারিখ সিলেক্ট করুন");
    const q=query(collection(db,"sales"),where("date",">=",f),where("date","<=",t));
    const snap=await getDocs(q);
    let s=0; snap.forEach(d=> s+=Number(d.data().total));
    alert("Total Sale: "+s);
};
