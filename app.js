import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, doc, updateDoc, increment, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let inventory={}, cart=[], suppliers={}, expenses=[];
const fixNum = (n)=> (isNaN(n)||n==null)?0:Number(n);

// --- Inventory ---
export async function addProduct(name,buy,sell,stock){
  await setDoc(doc(db,"products",name),{name,buy:fixNum(buy),sell:fixNum(sell),stock:fixNum(stock)});
}

// --- Supplier ---
export async function addSupplier(name,phone){
  await setDoc(doc(db,"suppliers",name),{name,phone});
  alert("Supplier Added!");
}

// --- Expenses ---
export async function addExpense(desc,amt){
  await addDoc(collection(db,"expenses"),{desc,amt:fixNum(amt),date:new Date().toISOString().split('T')[0]});
  alert("Expense Added!");
}

// --- POS ---
export function addToCart(name, qty){
  const item = inventory[name];
  if(!item||qty<1)return alert("Invalid Product or Qty");
  cart.push({name, qty, price:item.sell, buyPrice:item.buy, total:item.sell*qty});
  renderCart();
}
export function removeCartItem(index){cart.splice(index,1);renderCart();}
function renderCart(){
  let html="";
  cart.forEach((it,i)=>{html+=`<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.price}</td><td>${it.total}</td><td><button onclick="removeCartItem(${i})">✖</button></td></tr>`;});
  document.getElementById('cartBody')?document.getElementById('cartBody').innerHTML=html:null;
}
export async function finalizeSale(customer="Guest",discount=0,discountType="cash"){
  if(cart.length===0)return alert("Cart Empty!");
  let subTotal=cart.reduce((s,it)=>s+it.total,0);
  let dAmt=discountType==="percent"?subTotal*discount/100:discount;
  let grand=subTotal-dAmt;
  let profit=subTotal-cart.reduce((s,it)=>s+it.buyPrice*it.qty,0)-dAmt;
  const now=new Date();
  const dateStr=now.toISOString().split('T')[0];
  for(let it of cart){await updateDoc(doc(db,"products",it.name),{stock:increment(-it.qty)});}
  await addDoc(collection(db,"sales"),{customer,items:cart,total:grand,profit,date:dateStr,time:now.toLocaleTimeString()});
  cart=[];renderCart();alert("Sale Completed!");
}

// --- Real-time Inventory Load ---
onSnapshot(collection(db,"products"),snap=>{
  inventory={};
  let html="<option value=''>Select Product</option>";
  snap.forEach(d=>{const data=d.data();inventory[data.name]=data;html+=`<option value="${data.name}">${data.name}</option>`;});
  document.getElementById('product')?document.getElementById('product').innerHTML=html:null;
});
