import JsBarcode from "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";

// Generate barcode when adding product
window.generateBarcode = () => {
  const val = document.getElementById('pBC').value;
  if(!val) return alert("বারকোড দিন!");
  const svg = document.getElementById('barcode');
  JsBarcode(svg, val, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: true
  });
};
