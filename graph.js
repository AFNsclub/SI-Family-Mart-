const ctx = document.getElementById('salesChart');
if(ctx){
    new Chart(ctx,{
        type:'bar',
        data:{ labels:['আজ','কাল','গতকাল'], datasets:[{label:'Daily Sale',data:[1200,900,1500],backgroundColor:'rgba(54,162,235,0.6)'}] },
        options:{ responsive:true }
    });
}
