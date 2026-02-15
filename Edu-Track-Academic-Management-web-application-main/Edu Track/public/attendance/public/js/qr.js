const qr = new QRious({
  element: document.getElementById('qrcode'),
  size: 200
});

function generateToken() {
  return Math.random().toString(36).substring(2, 10);
}

function updateQR() {
  const token = generateToken();
  qr.value = token;
  sessionStorage.setItem('qrToken', token);
}

setInterval(updateQR, 45000); // update every 45 seconds
updateQR();
