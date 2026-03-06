// Sales Chart using Chart.js
const ctx = document.getElementById('salesChart')?.getContext('2d');
if(ctx){
  const labels = [];
  const dataSales = [];
  
  // Fetch last 7 days sales
  const today = new Date();
  for(let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(today.getDate()-i);
    const dStr = d.toISOString().split('T')[0];
    labels.push(dStr);
    dataSales.push(0); // placeholder
  }

  import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
  onSnapshot(collection(db,"sales"),snap=>{
    let tempData = labels.map(l=>0);
    snap.forEach(d=>{
      const data = d.data();
      const idx = labels.indexOf(data.date);
      if(idx!==-1) tempData[idx]+=Number(data.total);
    });
    myChart.data.datasets[0].data = tempData;
    myChart.update();
  });

  const myChart = new Chart(ctx,{
    type:'line',
    data:{
      labels:labels,
      datasets:[{
        label:'মোট বিক্রি (৳)',
        data:dataSales,
        fill:true,
        backgroundColor:'rgba(37,99,235,0.2)',
        borderColor:'#2563eb',
        tension:0.3,
        borderWidth:2,
        pointRadius:4,
        pointBackgroundColor:'#2563eb'
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:true, position:'top'},
        tooltip:{mode:'index', intersect:false}
      },
      scales:{
        x:{display:true, title:{display:true,text:'তারিখ'}},
        y:{display:true, title:{display:true,text:'বিক্রি (৳)'}}
      }
    }
  });
}
