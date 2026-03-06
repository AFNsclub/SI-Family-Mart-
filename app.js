// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyBI8FZjLO48gYACKhJRkptj-y03NHRK5Ho",
  authDomain: "fir-i-family-mart.firebaseapp.com",
  projectId: "fir-i-family-mart",
  storageBucket: "fir-i-family-mart.firebasestorage.app",
  messagingSenderId: "73889024539",
  appId: "1:73889024539:web:271561c9dba17b5a6b06be"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth check
auth.onAuthStateChanged(user => {
    if(!user) location.href='login.html';
});

// =========================
// STOCK MANAGEMENT
// =========================
let inventory = {};
if(document.getElementById('stockBody')){
    db.collection('inventory').onSnapshot(snap => {
        inventory = {};
        let html = '';
        snap.forEach(doc=>{
            const data = doc.data();
            inventory[data.name] = data;
            html += `<tr>
                <td>${data.name}</td>
                <td>${data.buy}৳</td>
                <td>${data.sell}৳</td>
                <td>${data.stock}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="editStock('${doc.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteStock('${doc.id}')">Delete</button>
                </td>
            </tr>`;
        });
        document.getElementById('stockBody').innerHTML = html;
    });
}

// Add Stock
function addStock(){
    const name = document.getElementById('iName').value.trim();
    const buy = Number(document.getElementById('iBuy').value);
    const sell = Number(document.getElementById('iSell').value);
    const stock = Number(document.getElementById('iStock').value);
    if(!name||!buy||!sell||!stock) return alert("সব ফিল্ড পূরণ করুন");
    db.collection('inventory').add({name,buy,sell,stock,barcode: ''});
    document.getElementById('iName').value='';
    document.getElementById('iBuy').value='';
    document.getElementById('iSell').value='';
    document.getElementById('iStock').value='';
}

function editStock(id){
    const data = inventory[id] || {};
    const name = prompt("নতুন নাম", data.name); 
    const buy = prompt("নতুন Buy Price", data.buy);
    const sell = prompt("নতুন Sell Price", data.sell);
    const stock = prompt("নতুন Stock", data.stock);
    if(name && buy && sell && stock){
        db.collection('inventory').doc(id).update({name,buy:Number(buy),sell:Number(sell),stock:Number(stock)});
    }
}

function deleteStock(id){
    if(confirm("আপনি কি সত্যিই মুছে ফেলতে চান?")) db.collection('inventory').doc(id).delete();
}

// =========================
// SUPPLIER MANAGEMENT
// =========================
let suppliers = {};
if(document.getElementById('supplierBody')){
    db.collection('suppliers').onSnapshot(snap => {
        suppliers = {};
        let html = '';
        snap.forEach(doc=>{
            const data = doc.data();
            suppliers[doc.id] = data;
            html += `<tr>
                <td>${data.name}</td>
                <td>${data.phone}</td>
                <td>${data.address}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="editSupplier('${doc.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${doc.id}')">Delete</button>
                </td>
            </tr>`;
        });
        document.getElementById('supplierBody').innerHTML = html;
    });
}

function addSupplier(){
    const name = document.getElementById('sName').value.trim();
    const phone = document.getElementById('sPhone').value.trim();
    const address = document.getElementById('sAddress').value.trim();
    if(!name||!phone||!address) return alert("সব ফিল্ড পূরণ করুন");
    db.collection('suppliers').add({name,phone,address});
    document.getElementById('sName').value='';
    document.getElementById('sPhone').value='';
    document.getElementById('sAddress').value='';
}

function editSupplier(id){
    const data = suppliers[id];
    const name = prompt("নতুন নাম", data.name);
    const phone = prompt("নতুন ফোন", data.phone);
    const address = prompt("নতুন ঠিকানা", data.address);
    if(name && phone && address){
        db.collection('suppliers').doc(id).update({name,phone,address});
    }
}

function deleteSupplier(id){
    if(confirm("আপনি কি সত্যিই মুছে ফেলতে চান?")) db.collection('suppliers').doc(id).delete();
}

// =========================
// EXPENSES
// =========================
let expenses = {};
if(document.getElementById('expenseBody')){
    db.collection('expenses').orderBy('date','desc').onSnapshot(snap=>{
        expenses={};
        snap.forEach(d=>{expenses[d.id]=d.data();});
        renderExpenses();
    });
}

function renderExpenses(filter=""){
    if(!document.getElementById('expenseBody')) return;
    let html='';
    for(let id in expenses){
        const e = expenses[id];
        if(filter && !e.title.toLowerCase().includes(filter.toLowerCase())) continue;
        html+=`<tr>
            <td>${e.title}</td>
            <td>${e.amount}৳</td>
            <td>${e.date}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteExpense('${id}')">Delete</button></td>
        </tr>`;
    }
    document.getElementById('expenseBody').innerHTML = html;
}

function addExpense(){
    const title=document.getElementById('eTitle').value.trim();
    const amount=Number(document.getElementById('eAmount').value);
    const date=document.getElementById('eDate').value;
    if(!title||!amount||!date) return alert("সব ফিল্ড পূরণ করুন");
    db.collection('expenses').add({title,amount,date});
    document.getElementById('eTitle').value='';
    document.getElementById('eAmount').value='';
    document.getElementById('eDate').value='';
}

function deleteExpense(id){
    if(confirm("আপনি কি সত্যিই মুছে ফেলতে চান?")) db.collection('expenses').doc(id).delete();
}

// =========================
// SALES REPORTS
// =========================
if(document.getElementById('salesChart')){
    db.collection('sales').onSnapshot(snap=>{
        const dates = {}, labels=[], salesData=[], profitData=[];
        snap.forEach(doc=>{
            const s = doc.data();
            labels.push(s.date);
            salesData.push(s.total);
            profitData.push(s.profit);
        });
        const ctx = document.getElementById('salesChart').getContext('2d');
        new Chart(ctx,{
            type:'bar',
            data:{labels:labels,datasets:[
                {label:'Sales',data:salesData,backgroundColor:'#2563eb'},
                {label:'Profit',data:profitData,backgroundColor:'#10b981'}
            ]},
            options:{responsive:true,plugins:{legend:{position:'top'}}}
        });
    });
}

// =========================
// LOGOUT
// =========================
if(document.getElementById('logoutBtn')){
    document.getElementById('logoutBtn').addEventListener('click',()=>{
        auth.signOut().then(()=>{location.href='login.html';});
    });
}
