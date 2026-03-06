// graph.js
import { inv } from "./app.js";
const ctx = document.getElementById('salesChart');
if(ctx){
    new Chart(ctx,{
        type:'bar',
        data:{
            labels:Object.keys(inv),
            datasets:[{label:'Stock Value',data:Object.values(inv).map(i=>i.stock*i.buy),backgroundColor:'rgba(54,162,235,0.7)'}]
        },
        options:{responsive:true,plugins:{legend:{display:true}}}
    });
}
